import { promises as fs } from 'fs';

import posthtml from 'posthtml';
import include from './posthtml-include';
import { green } from 'colorette';

export default function(options = {}) {
  return {
    name: 'posthtml',
    buildEnd: async () => {
      if (!options.src || !options.dest) {
        return;
      }
      const html = await fs.readFile(options.src, { encoding: 'utf-8' });

      const plugins = [
        include({
          root: './src'
        })
      ];
      const result = await posthtml(plugins).process(html);

      try {
        await fs.unlink(options.dest);
      } catch (exc) { }

      await fs.writeFile(options.dest, result.html, { encoding: 'utf-8' });
      console.log(green(`written html template ${options.dest}`))
    }
  };
}