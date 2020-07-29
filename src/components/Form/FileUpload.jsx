import React, { useState, useContext } from 'react';
import { Button, message, Upload } from 'antd';
import { ModalContext } from "../contexts/ModalContext"

function csvJSON(csv){

  var lines=csv.split("\n");

  var result = [];

  // NOTE: If your columns contain commas in their values, you'll need
  // to deal with those before doing the next step 
  // (you might convert them to &&& or something, then covert them back later)
  // jsfiddle showing the issue https://jsfiddle.net/
  var headers=lines[0].split(",");

  for(var i=1;i<lines.length;i++){

      var obj = {};
      var currentline=lines[i].split(",");

      for(var j=0;j<headers.length;j++){
          obj[headers[j]] = currentline[j];
      }

      result.push(obj);

  }

  return JSON.stringify(result); 
}

const FileUpload = (props) => {

  const { modalState, setModal } = useContext(ModalContext)
  const { updateData } = props

  const uploadProps = {
    name: 'file',
    action: '//jsonplaceholder.typicode.com/posts/',
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
         let reader = new FileReader();
          reader.onload = (e) => {
            try {
              let data = JSON.parse(e.target.result)
              updateData(data)
            } catch {
              let data = csvJSON(e.target.result)
              data = JSON.parse(data)
              updateData(data)
            }  
          }
          reader.readAsText(info.file.originFileObj);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <>
      <Upload {...uploadProps}>
        <Button>
           Select File
        </Button>
      </Upload>
    </>
  );

};

export default FileUpload