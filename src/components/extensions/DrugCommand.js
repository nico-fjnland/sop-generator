import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';

// Eigener Plugin-Key um Konflikt mit SlashCommand zu vermeiden
const drugSuggestionPluginKey = new PluginKey('drugSuggestion');

export const DrugCommand = Extension.create({
  name: 'drugCommand',

  addOptions() {
    return {
      suggestion: {
        char: '#',
        pluginKey: drugSuggestionPluginKey,
        command: ({ editor, range, props }) => {
          // Füge den kanonischen Wirkstoffnamen als Plain-Text ein
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(props.canonical)
            .run();
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
