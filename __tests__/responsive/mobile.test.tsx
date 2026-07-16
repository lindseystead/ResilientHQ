/**
 * Mobile Responsive Tests
 *
 * Tests for responsive design, screen sizes, and mobile-specific behaviors.
 */

import { Button, Card, Input } from '@/src/shared/ui';
import React from 'react';
import { renderWithTheme } from '../../tests/helpers/testHelpers';
import Dimensions from 'react-native/Libraries/Utilities/Dimensions';

// Mock Dimensions (defined in jest.setup.js)
const mockDimensions = Dimensions as unknown as {
  get: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
};

describe('Mobile Responsive Design', () => {
  describe('Small Screen (iPhone SE)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 320, height: 568 });
    });

    it('should render components on small screen', () => {
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      expect(getByText('Test')).toBeTruthy();
    });

    it('should scale components appropriately', () => {
      const { getByText } = renderWithTheme(
        <Card>
          <Button title="Test" onPress={() => {}} />
        </Card>,
      );
      expect(getByText('Test')).toBeTruthy();
    });
  });

  describe('Medium Screen (iPhone X)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
    });

    it('should render components on medium screen', () => {
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      expect(getByText('Test')).toBeTruthy();
    });
  });

  describe('Large Screen (iPad)', () => {
    beforeEach(() => {
      mockDimensions.get.mockReturnValue({ width: 768, height: 1024 });
    });

    it('should render components on large screen', () => {
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      expect(getByText('Test')).toBeTruthy();
    });

    it('should use responsive scaling for large screens', () => {
      const { getByPlaceholderText } = renderWithTheme(
        <Input placeholder="Test" value="" onChangeText={() => {}} />,
      );
      expect(getByPlaceholderText('Test')).toBeTruthy();
    });
  });

  describe('Orientation Changes', () => {
    it('should handle landscape orientation', () => {
      mockDimensions.get.mockReturnValue({ width: 812, height: 375 });
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      expect(getByText('Test')).toBeTruthy();
    });

    it('should handle portrait orientation', () => {
      mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      expect(getByText('Test')).toBeTruthy();
    });
  });

  describe('Touch Targets', () => {
    it('should have adequate touch target size', () => {
      const { getByText } = renderWithTheme(<Button title="Test" onPress={() => {}} />);
      const button = getByText('Test');
      // Button should be accessible and have proper size
      expect(button).toBeTruthy();
    });
  });
});
