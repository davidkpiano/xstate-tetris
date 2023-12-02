import React from 'react';
import { Game, init } from './Game';
export const Context = React.createContext<Game>(init());
