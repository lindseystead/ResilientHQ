/**
 * useTypedNavigation Hook Tests
 *
 * Tests for typed navigation hook ensuring type-safe navigation.
 */

import { renderHook } from '@testing-library/react-native';
import { useTypedNavigation } from '@/src/shared/hooks/useTypedNavigation';
import { ROUTES } from '@/src/config/navigation';

const mockDispatch = jest.fn();
const mockGoBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

// Controls FEATURES.aiChatEnabled at read time so both the AI-enabled and
// AI-disabled (default) navigation paths can be exercised. Chatbot navigation
// falls back to the Advice screen when this flag is off.
let mockAiChatEnabled = false;

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    dispatch: mockDispatch,
    goBack: mockGoBack,
    canGoBack: mockCanGoBack,
  })),
  CommonActions: {
    navigate: (payload: unknown) => ({ type: 'NAVIGATE', payload }),
    reset: (payload: unknown) => ({ type: 'RESET', payload }),
  },
}));

// Mock the feature flags while preserving every other constant. A Proxy is used
// so `aiChatEnabled` reflects the current test's value at access time.
jest.mock('@/src/config/constants', () => {
  const actual = jest.requireActual('@/src/config/constants');
  return {
    ...actual,
    FEATURES: new Proxy(actual.FEATURES, {
      get(target, prop) {
        if (prop === 'aiChatEnabled') return mockAiChatEnabled;
        return target[prop as keyof typeof target];
      },
    }),
  };
});

describe('useTypedNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    mockAiChatEnabled = false;
  });

  it('should return navigation methods', () => {
    const { result } = renderHook(() => useTypedNavigation());

    expect(result.current.push).toBeDefined();
    expect(result.current.replace).toBeDefined();
    expect(result.current.back).toBeDefined();
  });

  it('should navigate to routes', () => {
    const { result } = renderHook(() => useTypedNavigation());

    result.current.push(ROUTES.home);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {
        name: 'App',
        params: {
          screen: 'HomeStack',
          params: {
            screen: 'Home',
          },
        },
      },
    });
  });

  it('should handle back navigation', () => {
    const { result } = renderHook(() => useTypedNavigation());

    result.current.back();

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('should handle route replacement', () => {
    const { result } = renderHook(() => useTypedNavigation());

    result.current.replace(ROUTES.profile);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'RESET',
      payload: {
        index: 0,
        routes: [
          {
            name: 'App',
            params: {
              screen: 'ProfileStack',
              params: {
                screen: 'Profile',
              },
            },
          },
        ],
      },
    });
  });

  it('should navigate with parameters', () => {
    const { result } = renderHook(() => useTypedNavigation());

    result.current.push(ROUTES.journal, { moodValue: '2', moodEmoji: '😊' });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {
        name: 'App',
        params: {
          screen: 'HomeStack',
          params: {
            screen: 'Journal',
            params: { moodValue: '2', moodEmoji: '😊' },
          },
        },
      },
    });
  });

  it('should navigate to chatbot with private session parameters when AI chat is enabled', () => {
    mockAiChatEnabled = true;

    const { result } = renderHook(() => useTypedNavigation());

    result.current.push(ROUTES.chatbot, { privateSession: true });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {
        name: 'App',
        params: {
          screen: 'HomeStack',
          params: {
            screen: 'Chatbot',
            params: { privateSession: true },
          },
        },
      },
    });
  });

  it('should fall back to the Advice screen when AI chat is disabled', () => {
    mockAiChatEnabled = false;

    const { result } = renderHook(() => useTypedNavigation());

    result.current.push(ROUTES.chatbot, { privateSession: true });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE',
      payload: {
        name: 'App',
        params: {
          screen: 'HomeStack',
          params: {
            screen: 'Advice',
          },
        },
      },
    });
  });

  it('should no-op when back navigation is unavailable', () => {
    mockCanGoBack.mockReturnValue(false);

    const { result } = renderHook(() => useTypedNavigation());

    result.current.back();

    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
