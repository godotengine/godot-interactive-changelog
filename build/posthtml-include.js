import fs from "fs";
import path from "path";

import parser from "posthtml-parser";

export default function(options) {
  options = options || {};
  options.root = options.root || './';
  options.encoding = options.encoding || 'utf-8';

  return function posthtmlInclude(tree) {
    tree.match({ tag: 'include' }, function(node) {
      if (!node.attrs.src) {
        return {
          tag: false,
          content: null
        };
      }

      const src = path.resolve(options.root, node.attrs.src);
      const source = fs.readFileSync(src, options.encoding);
      const subtree = parser(source);
      subtree.match = tree.match;
      const content = source.indexOf('include') !== -1? posthtmlInclude(subtree): subtree;

      if (tree.messages) {
        tree.messages.push({
          type: "dependency",
          file: src
        });
      }

      return {
        tag: false,
        content: content
      };
    });

    return tree;
  };
};