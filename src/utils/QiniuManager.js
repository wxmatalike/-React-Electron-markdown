const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
        this.bucket = bucket
        this.config = new qiniu.conf.Config();
        this.config.zone = qiniu.zone.Zone_z0;
        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
    }

    //上传
    uploadFile(key, localFilePath) {
        const options = {
            scope: this.bucket + ":" + key
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(this.mac);
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();

        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
        })
    }
    //删除
    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
        })
    }
    //获取文件的下载链接
    generateDownLink(key) {
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.gerBucketDomain()
        return domainPromise.then(data => {
            if (Array.isArray(data) && data.length != 0) {
                const patten = /^http?/
                this.publicBucketDomain = patten.test(data[0]) ? data[0] : `http://${data[0]}`
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
            } else {
                throw Error('域名未找到，或已过期，请及时查看')
            }
        })
    }
    //下载
    downloadFile(key, downloadPath) {
        //获取下载链接，向链接发送请求，用reable stream pipe
        return this.generateDownLink(key).then(link => {
            const timestamp = new Date().getTime()
            const url = `${link}?timestamp=${timestamp}`
            return axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: { 'Cache-Control': 'no-cache' }
            })
        }).then(res => {
            const writer = fs.createWriteStream(downloadPath)
            res.data.pipe(writer)
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve({ key: key.substr(0, key.length - 3), downloadPath }))
                writer.on('error', reject)
            })
        }).catch(err => {
            return new Promise.reject({ err: err.response })
        })
    }
    //重命名文件
    renameFile(key, newKey) {
        const options = { force: true }
        return new Promise((resolve, reject) => {
            this.bucketManager.move(this.bucket, key, this.bucket, newKey, options, this._handleCallback(resolve, reject));
        })
    }
    //获取文件列表，用于全部下载至本地
    getFileList() {
        const options = {}
        return new Promise((resolve, reject) => {
            this.bucketManager.listPrefix(this.bucket, options, this._handleCallback(resolve, reject));
        })
    }
    //获取云端文件的基本信息，主要用于比对上传时间
    getStat(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject))
        })
    }
    //获取地址
    gerBucketDomain() {
        const reqURL = `http://uc.qiniuapi.com/v2/domains?tbl=${this.bucket}`
        const digest = qiniu.util.generateAccessToken(this.mac, reqURL)
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqURL, digest, this._handleCallback(resolve, reject))
        })
    }

    //返回值抽离处理
    _handleCallback(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr;
            }
            if (respInfo.statusCode == 200) {
                resolve(respBody)
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })
            }
        }
    }
}

module.exports = QiniuManager