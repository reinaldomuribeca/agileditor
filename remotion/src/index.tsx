import { registerRoot } from 'remotion';
import Root from './Root';
import { loadFont } from '@remotion/google-fonts/Sora';

// Load Sora before rendering so all scenes use the correct typeface
loadFont();

registerRoot(Root);
