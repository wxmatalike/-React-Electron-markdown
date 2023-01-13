import React, { useState, useEffect,useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faBookmark } from '@fortawesome/free-regular-svg-icons'
import PropTypes from 'prop-types';
import useKeyPress from "../hooks/useKeyPress";

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(0)
    const [value, setValue] = useState('')
    const enterPress = useKeyPress(13)
    const escPress = useKeyPress(27)
    const editRef = useRef(null)

    useEffect(() => {
        if (enterPress && editStatus) {
            const editItem = files.find(file => { return file.id === editStatus })
            onSaveEdit(editItem.id, value)
            setEditStatus(false)
            setValue('')
        }
        if (escPress && editStatus) {
            closeEdit()
        }
    })

    useEffect(() => {
        if (editStatus)
        editRef.current.focus()
    }, [editStatus])

    const closeEdit = () => {
        setEditStatus(0)
        setValue('')
    }

    return (
        <>
            <ul className='list-group list-group-flush file-list'>
                {
                    files.map(file => {
                        return <li className='list-group-item bg-light d-flex align-items-center row file-item g-0' key={file.id}>
                            {
                                (file.id !== editStatus) &&
                                <>
                                    <span className='col-2'> <FontAwesomeIcon icon={faBookmark} /></span>
                                    <span className='col-8 c-link' onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                    <button type="button" className="icon-btn col-1" onClick={() => { setEditStatus(file.id); setValue(file.title) }}>
                                        <FontAwesomeIcon title='编辑' icon={faEdit} />
                                    </button>
                                    <button type="button" className="icon-btn col-1" onClick={() => { onFileDelete(file.id) }}>
                                        <FontAwesomeIcon title='删除' icon={faTrash} />
                                    </button>
                                </>
                            }
                            {
                                (file.id === editStatus) &&
                                <>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <input ref={editRef} className="form-control" style={{ height: '30px' }} value={value} onChange={(e) => { setValue(e.target.value) }} />
                                        <button type="button" className="icon-btn" onClick={closeEdit}>
                                            <FontAwesomeIcon title='关闭' icon={faTimes} />
                                        </button>
                                    </div>
                                </>
                            }
                        </li>
                    })
                }
            </ul>
        </>
    )
}

FileList.propTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit: PropTypes.func
}

export default FileList