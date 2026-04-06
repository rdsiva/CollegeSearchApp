const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

module.exports = {
  router: { push: mockPush, back: mockBack, replace: mockReplace },
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ setOptions: jest.fn() }),
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
};
