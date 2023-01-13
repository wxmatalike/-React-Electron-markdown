import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types';

const BottomBtn = ({ text, color, icon, btnClick }) => {
    return (
        <button type='button' className={`btn no-border ${color}`} onClick={() => { btnClick() }}>
            <FontAwesomeIcon icon={icon} />
            <span className='ms-2'>{text}</span>
        </button>
    )
}
BottomBtn.propTypes = {
    text: PropTypes.string,
    color: PropTypes.string,
    icon: PropTypes.element.isRequired,
    btnClick: PropTypes.func
}
BottomBtn.defaultProps = {
    text: '新建'
}

export default BottomBtn