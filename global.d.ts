declare module 'react-dom';
declare module 'lucide-react';

declare module 'react' {
	export type ReactNode = any;
	export type FC<P = {}> = (props: P & { children?: ReactNode }) => JSX.Element | null;
	export type FormEvent = any;
	const React: any;
	export default React;
}

declare module 'react/jsx-runtime' {
	export const jsx: any;
	export const jsxs: any;
	export const Fragment: any;
}
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

declare module 'react';
declare module 'react-dom';
declare module 'react/jsx-runtime';
declare module 'lucide-react';
