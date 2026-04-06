// Mock expo/src/winter/installGlobal — prevents lazy getters being installed
// on global during Jest tests (avoids "outside of scope" errors in Expo SDK 54)
module.exports = {
  installGlobal: () => {},
  defineLazyObjectProperty: () => {},
};
