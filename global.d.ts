declare module 'react-quill' {
  import * as React from 'react';
  
  export interface QuillOptions {
    theme?: string;
    modules?: any;
    formats?: string[];
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    readOnly?: boolean;
    preserveWhitespace?: boolean;
    tabIndex?: number;
  }

  export interface ReactQuillProps extends React.PropsWithChildren<QuillOptions> {
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta: any, source: any, editor: any) => void;
    onChangeSelection?: (selection: any, source: any, editor: any) => void;
    onFocus?: (selection: any, source: any, editor: any) => void;
    onBlur?: (previousSelection: any, source: any, editor: any) => void;
    onKeyDown?: React.KeyboardEventHandler<any>;
    onKeyPress?: React.KeyboardEventHandler<any>;
    onKeyUp?: React.KeyboardEventHandler<any>;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
    id?: string;
  }

  export default class ReactQuill extends React.Component<ReactQuillProps> {
    getEditor(): any;
  }
}
