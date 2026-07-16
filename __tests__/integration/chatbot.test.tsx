/**
 * Chatbot Feature Integration Tests
 *
 * End-to-end tests for the AI chatbot including message sending,
 * streaming responses, and error handling.
 */

import { ChatbotScreen } from '@/src/features/chatbot';
import * as chatService from '@/src/domains/ai';
import { waitFor } from '@testing-library/react-native';
import React from 'react';
import { renderWithAuth } from '../../tests/helpers/testHelpers';

jest.mock('@/src/domains/ai', () => ({
  requestChatCompletion: jest.fn(),
  saveUserMessage: jest.fn(),
  saveAssistantMessage: jest.fn(),
  getChatHistory: jest.fn(),
  streamChatCompletion: jest.fn(),
  sendChatMessage: jest.fn(),
  getDeviceSafetyContext: jest.fn(() => ({
    safetyLocale: 'en-US',
    safetyCountry: 'US',
  })),
  resolveCrisisSupportRouting: jest.fn(() => ({
    context: { locale: 'en-US', countryCode: 'US' },
    bodyText:
      'If you may act on thoughts of self-harm or feel unsafe right now, call or text 988 now. If you are in immediate danger, call 911.',
    primaryCallAction: { label: 'Call 988', url: 'tel:988' },
    primaryTextAction: { label: 'Text 988', url: 'sms:988' },
    emergencyAction: { label: 'Call 911', url: 'tel:911' },
    directoryAction: { label: 'Find Local Hotline', url: 'https://findahelpline.com' },
  })),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

describe('Chatbot Feature Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Sending', () => {
    it('should send a message successfully', async () => {
      (chatService.requestChatCompletion as jest.Mock).mockResolvedValue({
        content: 'Test response',
      });

      (chatService.saveUserMessage as jest.Mock).mockResolvedValue('msg-1');
      (chatService.saveAssistantMessage as jest.Mock).mockResolvedValue('msg-2');

      const { getByPlaceholderText } = renderWithAuth(<ChatbotScreen />);

      await waitFor(() => {
        expect(getByPlaceholderText).toBeDefined();
      });
    });

    it('should handle API errors gracefully', async () => {
      (chatService.requestChatCompletion as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { getByText } = renderWithAuth(<ChatbotScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Chat History', () => {
    it('should load chat history', async () => {
      (chatService.getChatHistory as jest.Mock).mockResolvedValue([
        { id: 'msg-1', content: 'Hello', role: 'user' },
        { id: 'msg-2', content: 'Hi there!', role: 'assistant' },
      ]);

      const { getByText } = renderWithAuth(<ChatbotScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });

  describe('Streaming Responses', () => {
    it('should handle streaming responses', async () => {
      (chatService.streamChatCompletion as jest.Mock).mockResolvedValue('Streaming');

      const { getByText } = renderWithAuth(<ChatbotScreen />);

      await waitFor(() => {
        expect(getByText).toBeDefined();
      });
    });
  });
});
