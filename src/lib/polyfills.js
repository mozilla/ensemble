// Provide polyfills for use in older browsers.
//
// babel-polyfill is big, but importing modules as-needed from core-js is a game
// of whack-a-mole. We did use core-js in the past, but even after importing
// many individual modules we were left unsure that we had covered everything.
import 'babel-polyfill';
