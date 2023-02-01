import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faBookmark } from '@fortawesome/free-regular-svg-icons'
import PropTypes from 'prop-types';
import useKeyPress from "../hooks/useKeyPress";
import useContextMenu from '../hooks/useContextMenu';
import { getParentNode } from '../utils/helper'
import './FileList.scss'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(0)
    const [value, setValue] = useState('')
    const [isExist, setExist] = useState(false)
    const enterPress = useKeyPress(13)
    const escPress = useKeyPress(27)
    const editRef = useRef(null)
    // eslint-disable-next-line
    useEffect(() => {
        const editItem = files.find(file => { return file.id === editStatus })
        if (enterPress && editStatus && (value.trim() !== '')) {
            const isExist = Object.values(files).some(val => {
                return val.title === value && val.id !== editStatus
            })
            if (isExist) {
                setExist(true)
                setTimeout(() => {
                    setExist(false)
                }, 2000);
            } else {
                onSaveEdit(editItem.id, value, editItem.isNew)
                setEditStatus(0)
                setValue('')
            }
        }
        if (escPress && editStatus) {
            closeEdit(editItem)
        }
    })

    useEffect(() => {
        if (editStatus)
            editRef.current.focus()
    }, [editStatus])

    useEffect(() => {
        const newFile = files.find(file => { return file.isNew })
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])

    const clickItem = useContextMenu([{
        label: '打开',
        click: () => {
            const parentElement = getParentNode(clickItem.current, 'file-item')
            if (parentElement) {
                onFileClick(parentElement.dataset.id)
            }
        }
    }, {
        label: '重命名',
        click: () => {
            const parentElement = getParentNode(clickItem.current, 'file-item')
            if (parentElement) {
                setEditStatus(parentElement.dataset.id); setValue(parentElement.dataset.title)
            }
        }
    }, {
        label: '删除',
        click: () => {
            const parentElement = getParentNode(clickItem.current, 'file-item')
            if (parentElement) {
                onFileDelete(parentElement.dataset.id)
            }
        }
    }], '.file-list', [files])

    const closeEdit = (editItem) => {
        setEditStatus(0)
        setValue('')
        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }
    //失焦且无值自动关闭
    const BlurInput = (file) => {
        if (value === '' && file.isNew) {
            closeEdit(file)
        }
    }

    return (
        <>
            <ul className='list-group list-group-flush file-list'>
                {
                    files.map(file => {
                        return <li className='list-group-item bg-light d-flex align-items-center row file-item g-0' key={file.id}
                            data-id={file.id} data-title={file.title}>
                            {
                                (file.id !== editStatus && !file.isNew) &&
                                <>
                                    <span className='col-2'> <FontAwesomeIcon icon={faBookmark} /></span>
                                    <span className='col-10 c-link' onClick={() => { onFileClick(file.id) }}>{file.title}</span>
                                </>
                            }
                            {
                                ((file.id === editStatus) || file.isNew) &&
                                <>
                                    <div className="d-flex justify-content-between align-items-center file-list-item">
                                        <input ref={editRef} className="form-control" placeholder='请输入名称' style={{ height: '30px' }}
                                            value={value} onChange={(e) => { setValue(e.target.value) }}
                                            onBlur={() => { BlurInput(file) }} />
                                        {isExist && <span className='exist'>名称已存在</span>}
                                        <button type="button" className="icon-btn" onClick={() => { closeEdit(file) }}>
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