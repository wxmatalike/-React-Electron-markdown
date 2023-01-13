import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './TabList.scss'

const TabList = ({ files, activeId, unsaveIds, onTabClick, onCloseTab }) => {
    return (
        <>
            <ul className="nav nav-pills tablist">
                {
                    files.map(file => {
                        const withUnSavedMark = unsaveIds.includes(file.id)
                        const fClass = classNames({ 'nav-link': true, 'active': file.id === activeId, withUnSaved: withUnSavedMark })
                        return (
                            <li className="nav-item" key={file.id}>
                                <a className={fClass} href="#" onClick={(e) => { e.preventDefault(); onTabClick(file.id) }}>
                                    {file.title}
                                    <span className='close-icon ms-2' onClick={(e) => { e.stopPropagation(); onCloseTab(file.id) }}>
                                        <FontAwesomeIcon title='关闭' icon={faTimes} />
                                    </span>
                                    {withUnSavedMark && <span className='rounded-circle unsaved-icon ms-2'></span>}
                                </a>
                            </li>
                        )
                    })
                }
            </ul>
        </>
    )
}

TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unsaveIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onCloseTab: PropTypes.func
}
TabList.defaultProps = {
    unsaveIds: []
}

export default TabList