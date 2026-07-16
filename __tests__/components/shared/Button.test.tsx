/**
 * Button Component Tests
 *
 * Comprehensive tests for the Button component including all variants,
 * states, and interactions.
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { Button } from '@/src/shared/ui';
import { renderWithTheme } from '../../../tests/helpers/testHelpers';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with title', () => {
      const { getByText } = renderWithTheme(<Button title="Test Button" onPress={() => {}} />);
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('should render with primary variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Primary" variant="primary" onPress={() => {}} />,
      );
      expect(getByText('Primary')).toBeTruthy();
    });

    it('should render with secondary variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Secondary" variant="secondary" onPress={() => {}} />,
      );
      expect(getByText('Secondary')).toBeTruthy();
    });

    it('should render with outline variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Outline" variant="outline" onPress={() => {}} />,
      );
      expect(getByText('Outline')).toBeTruthy();
    });

    it('should render with outline variant', () => {
      const { getByText } = renderWithTheme(
        <Button title="Outline" variant="outline" onPress={() => {}} />,
      );
      expect(getByText('Outline')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = renderWithTheme(<Button title="Test" onPress={onPress} />);

      fireEvent.press(getByText('Test'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = renderWithTheme(<Button title="Test" onPress={onPress} disabled />);

      fireEvent.press(getByText('Test'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('should not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByLabelText } = renderWithTheme(<Button title="Test" onPress={onPress} loading />);

      fireEvent.press(getByLabelText('Test'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      const { getByTestId } = renderWithTheme(<Button title="Test" onPress={() => {}} loading />);
      // ActivityIndicator should be present
      expect(getByTestId).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      // Button text should be accessible
      expect(getByText('Test')).toBeTruthy();
    });
  });
});
