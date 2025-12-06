import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodePro as ImageNodeProComponent } from "./image-node-pro"

/**
 * Custom ImageNodePro extension for TipTap
 * Provides enhanced image functionality: alignment, caption, download
 */
export const ImageNodePro = Node.create({
  name: "imageNodePro",

  group: "block",

  draggable: true,

  selectable: true,

  atom: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      caption: {
        default: "",
      },
      displayMode: {
        default: "inline", // "inline" (text width) or "full" (full box width)
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-node-pro"]',
        getAttrs: (dom) => {
          const img = dom.querySelector("img")
          const figcaption = dom.querySelector("figcaption")
          return {
            src: img?.getAttribute("src"),
            alt: img?.getAttribute("alt"),
            title: img?.getAttribute("title"),
            caption: figcaption?.textContent || "",
            displayMode: dom.getAttribute("data-display-mode") || "inline",
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      mergeAttributes(
        { "data-type": "image-node-pro", "data-display-mode": HTMLAttributes.displayMode },
        this.options.HTMLAttributes
      ),
      [
        "img",
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt,
          title: HTMLAttributes.title,
        },
      ],
      HTMLAttributes.caption ? ["figcaption", HTMLAttributes.caption] : "",
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeProComponent)
  },

  addCommands() {
    return {
      setImageNodePro:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
      updateImageNodePro:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attrs)
        },
    }
  },
})

export default ImageNodePro

