import React from 'react';
import { Image, keyframes, usePrefersReducedMotion } from '@chakra-ui/react';
import logo from './logo.svg';



export const Logo = props => {

  return <Image src={props.logo} {...props} />;
};
