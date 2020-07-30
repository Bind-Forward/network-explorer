import React, {useState, useEffect, useContext} from 'react';
import { Form, Input, DatePicker, Select } from 'antd';
import FormModal from './FormModal';
import { ModalContext } from "../contexts/ModalContext"

import 'antd/dist/antd.css';
import './Form.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FormBar = (props) => {

  const [formbar] = Form.useForm();
  const [form, setForm] = useState({dates: [], device: "All", degree: 1})
  const { modalState } = useContext(ModalContext)
  const { updateGraph, reset } = props

  useEffect(() => {
    if(reset){ 
      //formbar.resetFields() // does not seem to reset form values...
      setForm({dates: [], device: "All", degree: 1}) // ensure degree dropdown is disabled upon reset
    }
  }, [reset])

  useEffect(() => {

    updateGraph(form)

  }, [form])
 
  return (
    <div id="form-bar">
      <Form form={formbar} layout='inline'>
        <FormModal/>
        <Form.Item label="Entity">
          <Input placeholder="Search for an entity" onPressEnter={(e) => {
            setForm({...form, device: e.target.value})
          }} />
        </Form.Item>
        <Form.Item label="Degree">
          <Select
            placeholder="All"
            disabled={form.device === 'All' ? true : false}
            onChange={(value) => {
              setForm({...form, degree: value})
            }}
          >  
            <Option value={1}>1st Degree</Option>
            <Option value={2}>2nd Degree</Option>
            <Option value={3}>3rd Degree</Option>
          </Select>
        </Form.Item>
        {modalState.DATE && <RangePicker 
          allowClear={false}
          showTime
          onChange={(value) => {
            setForm({...form, dates: value})
          }} 
        />}
      </Form>
    </div>
  );
};

export default FormBar;