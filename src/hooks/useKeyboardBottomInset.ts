import { useEffect, useState } from 'react';
import { Keyboard, type KeyboardEvent, Platform } from 'react-native';

/**
 * 키보드가 열린 동안 ScrollView/FlatList 하단에 추가할 여백.
 * Android 일부 키보드는 adjustResize만으로 focused input을 충분히 올리지 못해
 * 입력 화면에서 스크롤 가능한 빈 공간을 명시적으로 확보한다.
 */
export function useKeyboardBottomInset(extra = 0): number {
  const [bottomInset, setBottomInset] = useState(0);

  useEffect(() => {
    const handleShow = (event: KeyboardEvent) => {
      setBottomInset(event.endCoordinates.height + extra);
    };
    const handleHide = () => setBottomInset(0);

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      handleShow,
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      handleHide,
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [extra]);

  return bottomInset;
}
