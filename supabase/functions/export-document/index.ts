// Supabase Edge Function for server-side PDF/Word document export
// Uses Gotenberg for consistent rendering across all browsers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

// Scale factor for high-resolution screenshots (2x = ~150 DPI for print quality)
const SCREENSHOT_SCALE_FACTOR = 2;

// Base A4 dimensions in pixels at 96 DPI
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

// CORS Configuration - Whitelist of allowed origins
// Add new domains here when deploying to additional environments
const ALLOWED_ORIGINS = [
  'https://sop-generator.vercel.app',    // Sandbox/Test
  'https://editor.sop-notaufnahme.de',   // Production
];

// Allow localhost in development (any port)
const isLocalhost = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
};

// Check if origin is allowed
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (isLocalhost(origin)) return true;
  return ALLOWED_ORIGINS.includes(origin);
};

// Generate CORS headers for a specific origin
const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

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
  // Increased to 3s for complex flowcharts and heavy content
  formData.append('waitDelay', '3s')
  
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
 * Extracts complete .a4-page div elements from HTML using DOM parser
 * This is more reliable than regex-based parsing and handles all edge cases
 * @param html - The HTML content
 * @returns Array of HTML strings, one per .a4-page element
 */
function extractA4Pages(html: string): string[] {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    
    if (!doc) {
      console.error('Failed to parse HTML document')
      return fallbackExtractA4Pages(html)
    }
    
    const pageElements = doc.querySelectorAll('.a4-page')
    const pages: string[] = []
    
    for (const element of pageElements) {
      // Get outerHTML of each page element
      const pageHtml = element.outerHTML
      if (pageHtml) {
        pages.push(pageHtml)
      }
    }
    
    console.log(`DOM parser found ${pages.length} pages`)
    
    if (pages.length === 0) {
      console.warn('No .a4-page elements found, trying fallback')
      return fallbackExtractA4Pages(html)
    }
    
    return pages
  } catch (error) {
    console.error('DOM parser failed, using fallback:', error)
    return fallbackExtractA4Pages(html)
  }
}

/**
 * Fallback extraction using regex (for cases where DOM parser fails)
 * @param html - The HTML content
 * @returns Array of HTML strings, one per .a4-page element
 */
function fallbackExtractA4Pages(html: string): string[] {
  const pages: string[] = []
  const a4PagePattern = /<div[^>]*class="[^"]*a4-page[^"]*"[^>]*>/gi
  let match
  
  while ((match = a4PagePattern.exec(html)) !== null) {
    const startIndex = match.index
    const startTag = match[0]
    
    // Count opening and closing div tags to find the matching closing tag
    let depth = 1
    let currentIndex = startIndex + startTag.length
    
    while (depth > 0 && currentIndex < html.length) {
      const nextOpenDiv = html.indexOf('<div', currentIndex)
      const nextCloseDiv = html.indexOf('</div>', currentIndex)
      
      // If no more tags found, break
      if (nextCloseDiv === -1) break
      
      // If next open div comes before next close div, we're going deeper
      if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
        depth++
        currentIndex = nextOpenDiv + 4 // Move past '<div'
      } else {
        depth--
        if (depth === 0) {
          // Found the matching closing tag
          const endIndex = nextCloseDiv + 6 // Include '</div>'
          const pageHtml = html.substring(startIndex, endIndex)
          pages.push(pageHtml)
          break
        }
        currentIndex = nextCloseDiv + 6 // Move past '</div>'
      }
    }
  }
  
  console.log(`Fallback regex found ${pages.length} pages`)
  return pages
}

/**
 * Generates screenshots from HTML using Gotenberg for Word export
 * Each .a4-page element becomes a separate screenshot
 * Screenshots are generated at 2x resolution for better print quality
 * @param html - The HTML content
 * @param gotenbergUrl - The Gotenberg service URL
 * @returns Array of PNG screenshots as Uint8Array
 */
async function generateScreenshotsWithGotenberg(html: string, gotenbergUrl: string): Promise<Uint8Array[]> {
  const screenshots: Uint8Array[] = []
  
  // Extract all .a4-page elements from HTML using DOM parser
  const pageMatches = extractA4Pages(html)
  
  console.log(`Generating screenshots for ${pageMatches.length} pages at ${SCREENSHOT_SCALE_FACTOR}x resolution`)
  
  if (!pageMatches || pageMatches.length === 0) {
    // Fallback: take one screenshot of the entire page at higher resolution
    console.warn('No pages found, taking single screenshot')
    const scaledWidth = A4_WIDTH_PX * SCREENSHOT_SCALE_FACTOR
    const scaledHeight = A4_HEIGHT_PX * SCREENSHOT_SCALE_FACTOR
    const screenshot = await generateSingleScreenshot(
      html, 
      gotenbergUrl, 
      scaledWidth, 
      scaledHeight
    )
    screenshots.push(screenshot)
    return screenshots
  }
  
  // Extract the head section from the original HTML for styles
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
  const headContent = headMatch ? headMatch[1] : ''
  
  // Generate a screenshot for each page at 2x resolution
  // We use CSS transform to scale the content, and a larger viewport to capture it
  const scaledWidth = A4_WIDTH_PX * SCREENSHOT_SCALE_FACTOR
  const scaledHeight = A4_HEIGHT_PX * SCREENSHOT_SCALE_FACTOR
  
  for (let i = 0; i < pageMatches.length; i++) {
    console.log(`Generating screenshot for page ${i + 1}/${pageMatches.length}`)
    
    // Create HTML with scaled viewport and CSS transform
    // The .a4-page content is scaled up 2x using CSS transform
    // The viewport is 2x larger to capture the scaled content
    const pageHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          ${headContent}
          <style>
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: ${scaledWidth}px !important;
              height: ${scaledHeight}px !important;
              overflow: hidden !important;
              background: white !important;
            }
            .a4-page {
              width: ${A4_WIDTH_PX}px !important;
              height: ${A4_HEIGHT_PX}px !important;
              margin: 0 !important;
              box-shadow: none !important;
              /* Scale up the content 2x for higher resolution */
              transform: scale(${SCREENSHOT_SCALE_FACTOR}) !important;
              transform-origin: top left !important;
            }
          </style>
        </head>
        <body>
          ${pageMatches[i]}
        </body>
      </html>
    `
    
    // Generate screenshot with larger viewport (no scale parameter - not supported by Gotenberg)
    const screenshot = await generateSingleScreenshot(
      pageHtml, 
      gotenbergUrl, 
      scaledWidth, 
      scaledHeight
    )
    screenshots.push(screenshot)
  }
  
  console.log(`Successfully generated ${screenshots.length} screenshots`)
  return screenshots
}

/**
 * Generates a single screenshot using Gotenberg
 * 
 * Note: Gotenberg does not support a scale/deviceScaleFactor parameter.
 * For higher resolution, use a larger viewport and CSS transform in the HTML.
 * 
 * @param html - The HTML content
 * @param gotenbergUrl - The Gotenberg service URL
 * @param width - Viewport width in pixels
 * @param height - Viewport height in pixels
 * @returns PNG screenshot as Uint8Array
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
  
  // Screenshot dimensions (viewport size)
  formData.append('width', width.toString())
  formData.append('height', height.toString())
  
  // PNG format for best quality (lossless compression, no artifacts)
  formData.append('format', 'png')
  
  // Emulate print media type - this applies @media print CSS rules
  formData.append('emulatedMediaType', 'print')
  
  // Wait for content to load (3s for complex flowcharts and fonts)
  formData.append('waitDelay', '3s')
  
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
  // Extract origin from request for CORS
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Reject requests from non-allowed origins
  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
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
