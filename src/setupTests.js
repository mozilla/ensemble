import React from 'react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';


configure({ adapter: new Adapter() });

// Make React and shallow available to individual test files
global.React = React;
global.shallow = shallow;
