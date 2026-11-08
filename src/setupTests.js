import '@testing-library/jest-dom';

// react-router v7 uses TextEncoder, which the jsdom version bundled with react-scripts lacks.
import { TextDecoder, TextEncoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });
