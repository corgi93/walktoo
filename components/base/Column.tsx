import React from 'react';

import Box, { BoxProps } from './Box';

const Column: React.FC<BoxProps> = ({ style, ...props }) => (
  <Box {...props} style={[{ flexDirection: 'column' }, style]} />
);

export default Column;
