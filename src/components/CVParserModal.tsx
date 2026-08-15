import React from 'react';
import { CVParserModal as ParserView, CVParserModalProps } from '../features/parser/CVParserModal';

export const CVParserModal: React.FC<CVParserModalProps> = (props) => {
  return <ParserView {...props} />;
};

export { CVParserModal as ParserView } from '../features/parser/CVParserModal';
export { DropZone } from '../features/parser/DropZone';
export { DiffView } from '../features/parser/DiffView';
