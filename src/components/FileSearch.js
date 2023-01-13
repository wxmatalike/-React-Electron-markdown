import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types';
import useKeyPress from "../hooks/useKeyPress";

const FileSeach = ({ title, onFileSearch }) => {
    const [inputActive, setInputActive] = useState(false)
    const [value, setValue] = useState('')
    const inputRef = useRef(null)
    const enterPress = useKeyPress(13)
    const escPress = useKeyPress(27)

    const closeSearch = () => {
        setInputActive(false)
        setValue('')
    }

    useEffect(() => {
        if (enterPress && inputActive) {
            onFileSearch(value)
        }
        if (escPress && inputActive) {
            closeSearch()
        }
    })

    useEffect(() => {
        if (inputActive)
            inputRef.current.focus()
    }, [inputActive])

    return (
        <>
            <div className="alert alert-primary mb-0">
                {
                    !inputActive &&
                    <div className="d-flex justify-content-between align-items-center">
                        <span style={{ height: '30px', lineHeight: '30px' }}>{title}</span>
                        <button type="button" className="icon-btn" onClick={() => { setInputActive(true) }}>
                            <FontAwesomeIcon title='搜索' size="lg" icon={faSearch} />
                        </button>
                    </div>
                }
                {
                    inputActive &&
                    <div className="d-flex justify-content-between align-items-center">
                        <input ref={inputRef} className="form-control" style={{ height: '30px' }} value={value} onChange={(e) => { setValue(e.target.value) }} />
                        <button type="button" className="icon-btn" onClick={closeSearch}>
                            <FontAwesomeIcon title='关闭' size="lg" icon={faTimes} />
                        </button>
                    </div>
                }
            </div>

        </>
    )
}

FileSeach.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
}
FileSeach.defaultProps = {
    title: '我的云文档'
}
export default FileSeach