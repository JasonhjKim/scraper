import React, { Component } from 'react';
import styled from 'styled-components';
import { Table, TableHead, TableRow, TableCell, TableBody, Tooltip } from '@material-ui/core';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from './navbar';
import { ClipLoader } from 'react-spinners';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import socketIOClient from 'socket.io-client';

export default class CheckerMode extends Component {
    state = {
        data: [],
        showLoading: false,
        buttonState: false,
        status: "IDLE",
        statusBuilder: "",
    }

    componentDidMount() {
        const endpoint = "http://159.65.69.12:5000";
        const socket = socketIOClient(endpoint, { transports: ['websocket'] });
        socket.on('DataReady', data => {
            data.data.map((link) => {
                const { title, url, status} = link;
                if (status === false && title.indexOf("non-existent products") === - 1) status = true;
            })
            this.setState({ data: data.data, status: data.status })
        });

        socket.on("DataFinished", data => {
            let builder = ""
            console.log(this.state.data);
            this.state.data.map((item) => {
                builder = builder + (item.status ? "Online\r\n" : "ShutDown\r\n");
            })
            console.log(builder);
            this.setState({ status: data.status, statusBuilder: builder, showLoading: false })
        })

    }

    handleSubmit(e) {
        e.preventDefault(); 
        console.log("Request sent");
        this.setState({ data: {}, status: "IDLE", showLoading: true, buttonState: true, copy: null, builder:"" })
        axios.post('http://159.65.69.12:5000/', { "text": e.target[0].value }, { config: {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Credentials': "*",
              'Access-Control-Allow-Headers': "*",
              'Access-Control-Allow-Methods': "*",
            }}})
            .then(result => {
                console.log(result);
                let builder = "";
                // result.data.data.map((item) => builder += (item.status ? "online" : "shut down") + "\n")
                this.setState({ status: result.data.status, est: result.data.est, quantity: result.data.quantity }, () => console.log(this.state.data))
            })

            .catch(err => {
                console.log("This is the error: ", err);
            })

    }

    render() {
        return(
            <Body>
                <Navbar/>
                <Form onSubmit={this.handleSubmit.bind(this)}>
                    <Label><span style={{ color: "#6485CC"}}>Checker Mode:</span> Copy + Paste Links Here: </Label>
                    <TextArea name="" id="" cols="30" rows="10" required></TextArea>
                    <Tip>*Try to limit to 50 links at a time</Tip>
                    <Tip>*Make sure to use <em>http</em> not <em>https</em></Tip>
                    <SubmitButton type="submit" value={this.state.buttonState ? "Disabled" : "Hit it"} disabled={this.state.buttonState} color={this.state.buttonState}/>
                </Form>
                <ResultContainer>
                    { this.state.showLoading ? <ClipLoader sizeUnit={"px"} size={50} color={"#6485CC"} loading={this.state.showLoading}/> : null}
                    { this.state.status === "PROCESSING" ? 
                        <span>Your requet is being processed, estimation wait time for <i>{this.state.quantity}</i> link(s): <b>{this.state.est}</b></span>
                        : null 
                    }
                    { this.state.data.length > 0 ?

                        <React.Fragment>
                            { this.state.status === "FINISHED"? <ToolContainer>
                                <Tooltip title="Copy all status from the result">
                                    <CopyToClipboard text={this.state.statusBuilder}>
                                        <ToolButton>Copy All Status</ToolButton>
                                    </CopyToClipboard>
                                </Tooltip>
                                <Tooltip title="Copy all site title from the result">
                                    <CopyToClipboard text={this.state.statusBuilder}>
                                        <ToolButton>Copy All Site Title</ToolButton>
                                    </CopyToClipboard>
                                </Tooltip>
                            </ToolContainer> : null}
                            <Label>{`Found Links (${this.state.data.length}):`}</Label>
                            <StyledTable>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell> Product URL</TableCell>
                                        <TableCell> Site Title </TableCell>
                                        <TableCell> Status </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {
                                        this.state.data.map((item, index) => 
                                        <TableRow style={{ width: "300px"}}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell> {item.url}</TableCell>
                                            <TableCell>{ item.title }</TableCell>
                                            <TableCell align="center"> { item.status ? <StatusTrue/> : <StatusFalse/>}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </StyledTable>
                        </React.Fragment> :  <div>{ !this.state.showLoading ? "No result found. Please check textbox" : null }</div> }
                </ResultContainer>
            </Body>
        )
    }
}

const Form = styled.form`
    display: flex;
    flex-direction: column;
`

const Label = styled.label`
    color: #64B9CC;
    font-size: 24px;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
    align-self: flex-start;
`

const SubmitButton = styled.input`
    width: 343px;
    height: 58px;
    color: white;
    background-color: ${ props => props.color ? "red" : "#6485CC" };
    font-size: 24px;
    font-weight: bold;
    border-radius: 8px;
    align-self: center;
    margin: 1em;
    outline: none;
    border: none;
    /* box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); */
    box-shadow: 0 4px 6px -2px rgba(0, 0, 0, 0.05);
`

const TextArea = styled.textarea`
    width: 550px;
    height: 280px;
    border-radius: 4px;
`


const Body = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`

const ResultContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 6em;
`

const StyledTable = styled(Table)`
    width: 550px;
    height: 280px;
    align-self: flex-start;
`

const StatuTruesWrapper = styled.div`
    font-size: 16px;
    color: #56EA38;
`

const StatusFalseWrapper = styled.div`
    font-size: 16px;
    color: gray;
`

const StatusTrue = () => {
    return(
        <StatuTruesWrapper>
            ONLINE
        </StatuTruesWrapper>
    )
}

const StatusFalse = () => {
    return(
        <StatusFalseWrapper>
            SHUT DOWN
        </StatusFalseWrapper>
    )
}


const Tip = styled.div`
    font-size: 12px;
`


const ToolContainer = styled.div`
    display: flex;
    flex-direction: row;
    height: 60px;
    align-items: center;
    align-self: flex-start;
`

const ToolButton = styled.button`
    height: 40px;
    width: 120px;
    background-color: #cc7764;
    color: white;
    border-radius: 4px;
    border: none;
    outline: none;
    font-weight: bold;
    cursor: pointer;
    margin: 0 1em 0 0;

    &:hover {
        height: 38px;
    }
`
