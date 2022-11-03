import React from 'react';
import 'antd/dist/antd.css';
import './App.css';
import { InboxOutlined,CheckCircleOutlined,CloseCircleOutlined } from '@ant-design/icons';
import { Upload } from 'antd';

const { Dragger } = Upload;


function byteConvert(bytes) {
    const symbols = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let exp = Math.floor(Math.log(bytes) / Math.log(2));
    if (exp < 1) {
        exp = 0;
    }
    const i = Math.floor(exp / 10);
    bytes = bytes / Math.pow(2, 10 * i);

    if (bytes.toString().length > bytes.toFixed(2).toString().length) {
        bytes = bytes.toFixed(2);
    }
    return bytes + ' ' + symbols[i];
}

const App = () => (
    <Dragger
        name="file"
        action="/upload"
        multiple
        showUploadList={{
            showRemoveIcon:false
        }}
        itemRender={(el,file)=>{
            return <div
                className={"item"}
                style={{

                }}
            >
                <div style={{width:"50%",wordWrap:"break-word"}}>名称：{file.name}</div>
                <div style={{width:"25%"}}>大小：{byteConvert(file.size)}</div>
                <div style={{width:"25%"}}>状态：{(()=>{
                    switch (file.status) {
                        case "done":
                        case "success":
                            return <CheckCircleOutlined style={{color:"green"}}/>
                        case "error":
                            return <CloseCircleOutlined style={{color:"red"}}/>
                        case "uploading":
                            return `${file.percent.toFixed(2)}%`
                    }
                })()}</div>
            </div>
        }}
    >
        <p className="ant-upload-drag-icon">
            <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击上传或将文件拖拽到此区域</p>
    </Dragger>
);

export default App;
