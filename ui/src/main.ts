import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

console.log('Out of the night that covers me,\n' +
  'Black as the pit from pole to pole,\n' +
  'I thank whatever gods may be\n' +
  'For my unconquerable soul.\n' +
  '\n' +
  'In the fell clutch of circumstance\n' +
  'I have not winced nor cried aloud.\n' +
  'Under the bludgeonings of chance\n' +
  'My head is bloody, but unbowed.\n' +
  '\n' +
  'Beyond this place of wrath and tears\n' +
  'Looms but the Horror of the shade,\n' +
  'And yet the menace of the years\n' +
  'Finds, and shall find, me unafraid.\n' +
  '\n' +
  'It matters not how strait the gate,\n' +
  'How charged with punishments the scroll,\n' +
  'I am the master of my fate:\n' +
  'I am the captain of my soul.\n')

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
