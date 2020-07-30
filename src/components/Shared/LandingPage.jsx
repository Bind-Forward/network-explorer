import React from 'react';
import { Row, Col, Typography } from 'antd';
import FormModal from '../Form/FormModal';

const { Title } = Typography;

const LandingPage = (props) => {
  
  return (
    <>
      <Row type="flex" justify="center" align="middle" style={{minHeight: '100vh'}}>
        <Col span={8}></Col>
        <Col span={8}>
          <Title>NETWORK EXPLORER</Title>
          <FormModal/>
        </Col>
        <Col span={8}></Col>
      </Row>          
    </>
  );

};

export default LandingPage