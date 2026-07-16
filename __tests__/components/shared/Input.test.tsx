/**
 * Input Component Tests
 *
 * Comprehensive tests for the Input component including validation,
 * error states, and user interactions.
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Input } from '@/src/shared/ui';
import { renderWithTheme } from '../../../tests/helpers/testHelpers';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input with placeholder', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text" value="" onChangeText={() => {}} />,
      );
      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('should render with label', () => {
      const { getByText } = renderWithTheme(
        <Input label="Email" value="" onChangeText={() => {}} />,
      );
      expect(getByText('Email')).toBeTruthy();
    });

    it('should render with error message', () => {
      const { getByText } = renderWithTheme(
        <Input label="Email" value="" onChangeText={() => {}} error="Invalid email" />,
      );
      expect(getByText('Invalid email')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text" value="" onChangeText={onChangeText} />,
      );

      fireEvent.changeText(getByPlaceholderText('Enter text'), 'New text');
      expect(onChangeText).toHaveBeenCalledWith('New text');
    });

    it('should handle focus events', () => {
      const onFocus = jest.fn();
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text" value="" onChangeText={() => {}} onFocus={onFocus} />,
      );

      fireEvent(getByPlaceholderText('Enter text'), 'focus');
      expect(onFocus).toHaveBeenCalled();
    });

    it('should handle blur events', () => {
      const onBlur = jest.fn();
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Enter text" value="" onChangeText={() => {}} onBlur={onBlur} />,
      );

      fireEvent(getByPlaceholderText('Enter text'), 'blur');
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Security', () => {
    it('should mask password input', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Password" value="" onChangeText={() => {}} secureTextEntry />,
      );
      const input = getByPlaceholderText('Password');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      const { getByLabelText } = renderWithTheme(
        <Input label="Email" value="" onChangeText={() => {}} accessibilityLabel="Email input" />,
      );
      expect(getByLabelText('Email input')).toBeTruthy();
    });
  });
});
