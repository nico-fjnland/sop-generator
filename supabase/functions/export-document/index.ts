// Supabase Edge Function for server-side PDF/Word document export
// Uses Gotenberg for consistent rendering across all browsers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  html: string
  format: 'pdf' | 'docx'
  metadata?: {
    title?: string
    stand?: string
    documentId?: string
  }
  cacheKey?: string
}

/**
 * Generates a PDF from HTML using Gotenberg
 * @param html - The HTML content to convert
 * @param gotenbergUrl - The Gotenberg service URL
 * @returns PDF as ArrayBuffer
 */
async function generatePdfWithGotenberg(html: string, gotenbergUrl: string): Promise<ArrayBuffer> {
  // Create form data for Gotenberg
  const formData = new FormData()
  
  // Gotenberg expects an HTML file named "index.html"
  const htmlBlob = new Blob([html], { type: 'text/html' })
  formData.append('files', htmlBlob, 'index.html')
  
  // A4 dimensions (in inches)
  formData.append('paperWidth', '8.27')    // 210mm
  formData.append('paperHeight', '11.69')  // 297mm
  
  // No margins - content already has them
  formData.append('marginTop', '0')
  formData.append('marginBottom', '0')
  formData.append('marginLeft', '0')
  formData.append('marginRight', '0')
  
  // Print background colors and images
  formData.append('printBackground', 'true')
  
  // Emulate print media type - this applies @media print CSS rules
  formData.append('emulatedMediaType', 'print')
  
  // Wait for network to be idle (fonts, images loaded)
  formData.append('waitDelay', '2s')
  
  // Prefer CSS page size if defined
  formData.append('preferCssPageSize', 'true')
  
  const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gotenberg PDF generation failed: ${response.status} - ${errorText}`)
  }
  
  return response.arrayBuffer()
}

/**
 * Generates screenshots from HTML using Gotenberg for Word export
 * Each .a4-page element becomes a separate screenshot
 * @param html - The HTML content
 * @param gotenbergUrl - The Gotenberg service URL
 * @returns Array of PNG screenshots as Uint8Array
 */
async function generateScreenshotsWithGotenberg(html: string, gotenbergUrl: string): Promise<Uint8Array[]> {
  const screenshots: Uint8Array[] = []
  
  // Parse HTML to find all .a4-page elements
  // We need to create separate requests for each page since Gotenberg
  // takes screenshots of the full page, not individual elements
  
  // First, let's try to extract individual pages from the HTML
  // We'll wrap each page in its own HTML document
  const pageMatches = html.match(/<div[^>]*class="[^"]*a4-page[^"]*"[^>]*>[\s\S]*?<\/div>(?=\s*<div[^>]*class="[^"]*a4-page|$)/gi)
  
  if (!pageMatches || pageMatches.length === 0) {
    // Fallback: take one screenshot of the entire page
    const screenshot = await generateSingleScreenshot(html, gotenbergUrl, 794, 1123)
    screenshots.push(screenshot)
    return screenshots
  }
  
  // Extract the head section from the original HTML for styles
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const headContent = headMatch ? headMatch[1] : ''
  
  // Generate a screenshot for each page
  for (let i = 0; i < pageMatches.length; i++) {
    const pageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          ${headContent}
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 794px;
              height: 1123px;
              overflow: hidden;
            }
            .a4-page {
              width: 794px !important;
              height: 1123px !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
          </style>
        </head>
        <body>
          ${pageMatches[i]}
        </body>
      </html>
    `
    
    const screenshot = await generateSingleScreenshot(pageHtml, gotenbergUrl, 794, 1123)
    screenshots.push(screenshot)
  }
  
  return screenshots
}

/**
 * Generates a single screenshot using Gotenberg
 */
async function generateSingleScreenshot(
  html: string,
  gotenbergUrl: string,
  width: number,
  height: number
): Promise<Uint8Array> {
  const formData = new FormData()
  
  // Gotenberg expects an HTML file named "index.html"
  const htmlBlob = new Blob([html], { type: 'text/html' })
  formData.append('files', htmlBlob, 'index.html')
  
  // Screenshot dimensions
  formData.append('width', width.toString())
  formData.append('height', height.toString())
  
  // PNG format for best quality
  formData.append('format', 'png')
  formData.append('quality', '100')
  
  // Emulate print media type - this applies @media print CSS rules
  formData.append('emulatedMediaType', 'print')
  
  // Wait for content to load
  formData.append('waitDelay', '2s')
  
  // Optimize for quality, not speed
  formData.append('optimizeForSpeed', 'false')
  
  const response = await fetch(`${gotenbergUrl}/forms/chromium/screenshot/html`, {
    method: 'POST',
    body: formData,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gotenberg screenshot failed: ${response.status} - ${errorText}`)
  }
  
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { html, format, metadata, cacheKey }: ExportRequest = await req.json()

    if (!html || !format) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: html, format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check cache if cacheKey provided
    if (cacheKey) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        
        // Only use cache if service role key is available (Pro plan)
        if (serviceRoleKey && supabaseUrl) {
          const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

          const { data: cachedFile, error: cacheError } = await supabaseClient.storage
            .from('exports')
            .download(cacheKey)

          if (!cacheError && cachedFile) {
            const arrayBuffer = await cachedFile.arrayBuffer()
            const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            
            return new Response(arrayBuffer, {
              headers: {
                ...corsHeaders,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${metadata?.title || 'export'}.${format}"`,
                'X-Cache': 'HIT',
              },
            })
          }
        }
      } catch (cacheError) {
        console.warn('Cache check failed, continuing with render:', cacheError)
        // Continue without cache
      }
    }

    // Check if Gotenberg is configured
    const gotenbergUrl = Deno.env.get('GOTENBERG_URL')
    
    if (!gotenbergUrl) {
      // No Gotenberg service configured - return error to trigger client-side fallback
      return new Response(
        JSON.stringify({
          error: 'Server-side rendering not available',
          message: 'Gotenberg service not configured. Please set GOTENBERG_URL environment variable or use client-side export.',
          fallback: true,
        }),
        {
          status: 503, // Service Unavailable
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let result: ArrayBuffer
    let contentType: string
    let filename: string

    try {
      if (format === 'pdf') {
        // Generate PDF using Gotenberg
        result = await generatePdfWithGotenberg(html, gotenbergUrl)
        contentType = 'application/pdf'
        filename = `${metadata?.title || 'export'}.pdf`
      } else {
        // Generate Word document from screenshots
        const screenshots = await generateScreenshotsWithGotenberg(html, gotenbergUrl)
        
        // Import docx library
        const docx = await import('npm:docx@9.5.1')
        const { Document, Packer, Paragraph, ImageRun } = docx

        const docChildren = []

        for (let i = 0; i < screenshots.length; i++) {
          const screenshot = screenshots[i]
          
          // Create ImageRun from screenshot
          const imageRun = new ImageRun({
            data: screenshot,
            transformation: {
              width: 794,
              height: 1123,
            },
            type: 'png',
          })

          docChildren.push(
            new Paragraph({
              children: [imageRun],
              spacing: { before: 0, after: 0, line: 240 },
              pageBreakBefore: i > 0,
            })
          )
        }

        // Create document
        const doc = new Document({
          sections: [
            {
              properties: {
                page: {
                  margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                  },
                },
              },
              children: docChildren,
            },
          ],
        })

        const docxBuffer = await Packer.toBuffer(doc)
        result = docxBuffer.buffer
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        filename = `${metadata?.title || 'export'}.docx`
      }

      // Cache the result if cacheKey provided and service role key available
      if (cacheKey && result) {
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
          const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          
          // Only cache if service role key is available (Pro plan)
          if (serviceRoleKey && supabaseUrl) {
            const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

            await supabaseClient.storage
              .from('exports')
              .upload(cacheKey, result, {
                contentType,
                upsert: true,
                cacheControl: '3600', // 1 hour cache
              })
          }
        } catch (cacheError) {
          console.warn('Failed to cache export:', cacheError)
          // Continue without caching
        }
      }

      return new Response(result, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Cache': 'MISS',
        },
      })
    } catch (gotenbergError) {
      console.error('Gotenberg export failed:', gotenbergError)
      return new Response(
        JSON.stringify({
          error: 'Gotenberg export failed',
          message: gotenbergError instanceof Error ? gotenbergError.message : 'Unknown error',
          fallback: true,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Export error:', error)
    return new Response(
      JSON.stringify({
        error: 'Export failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
