import { useState, useEffect } from 'react';

const useKeyPress = (targetKeyCode) => {
    const [KeyPress, setKeyPress] = useState(false)

    const keyDownHandle = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPress(true)
        }
    }

    const keyUpHandle = ({ keyCode }) => {
        if (keyCode === targetKeyCode) {
            setKeyPress(false)
        }
    }
    useEffect(() => {
        document.addEventListener('keydown', keyDownHandle)
        document.addEventListener('keyup', keyUpHandle)
        return () => {
            document.removeEventListener('keydown', keyDownHandle)
            document.removeEventListener('keyup', keyUpHandle)
        }
    }, [])// eslint-disable-line react-hooks/exhaustive-deps

    return KeyPress
}

export default useKeyPress