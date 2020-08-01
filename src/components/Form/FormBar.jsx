import React, {useState, useEffect, useContext} from 'react';
import { Form, Input, DatePicker, Select } from 'antd';
import FormModal from './FormModal';
import { ModalContext } from "../contexts/ModalContext"

import 'antd/dist/antd.css';
import './Form.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FormBar = (props) => {

  const [form, setForm] = useState({dates: [], device: "All", degree: 1})
  const { modalState } = useContext(ModalContext)
  const { updateGraph, reset } = props
  const formRef = React.createRef();

  useEffect(() => {
    if(reset){ 
      setForm({dates: [], device: "All", degree: 1}) // ensure degree dropdown is disabled upon reset
      formRef.current.setFieldsValue({
        ENTITY: "",
        DEGREE: "All",
        DATE_RANGE: null
      });

    }
  }, [reset])

  useEffect(() => {

    updateGraph(form)

  }, [form])
 
  return (
    <div id="form-bar">
      <Form layout='inline' ref={formRef}>
        <FormModal/>
        <Form.Item label="Entity" name="ENTITY">
          <Input placeholder="Search for an entity" onPressEnter={(e) => {
            setForm({...form, device: e.target.value})
          }} />
        </Form.Item>
        <Form.Item label="Degree" name="DEGREE">
          <Select
            placeholder="All"
            disabled={form.device === 'All' ? true : false}
            onChange={(value) => {
              setForm({...form, degree: value})
            }}
          >  
            <Option value={1}>1st Degree</Option>
            <Option value={2}>2nd Degree</Option>
            <Option valueå={3}>3rd Degree</Option>
          </Select>
        </Form.Item>
        {modalState.DATE.present && 
          <Form.Item name="DATE_RANGE" label="Date Range">
            <RangePicker 
              allowClear={false}
              showTime
              onChange={(value) => {
                setForm({...form, dates: value})
              }} 
            />
          </Form.Item>
        }
      </Form>
    </div>
  );
};

export default FormBar;