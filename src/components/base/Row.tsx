import React from 'react';

import Box, { BoxProps } from './Box';

const Row: React.FC<BoxProps> = ({ style, ...props }) => (
  <Box {...props} style={[{ flexDirection: 'row' }, style]} />
);

export default Row;
