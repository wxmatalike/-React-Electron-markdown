import React from 'react'
import './Loader.scss'

const Loader = ({ text = '处理中' }) =>
(
    <div className='loading-component text-center'>
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{text}</span>
        </div>
        <h6 className='text-primary'>{text}</h6>
    </div>
)


export default Loader