import React, {Component, useEffect, useState} from 'react';
import './App.css';
import Macy from 'macy'
import {getFilesFromPath, Web3Storage} from "web3.storage";

const  apiToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDJmNzQ0OEIxREQzM2E4NzM0QjRlMjhCM2M1NzA3REE1NzlBNzIyNzUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTY3Nzg0MjExMjgsIm5hbWUiOiJGdW5ueSJ9.riVg62HvUuHiTe267gPLX5zix7kxrEy4LmoPYrPsOgs"
const gateway = "https://www.dweb.link/ipfs"

const namePrefix = "FunnyPic"
export default  class App extends Component {
    state={
        dataImages:[],
    }

    async componentDidMount() {
        const client = new Web3Storage({token: apiToken});
        this.setState({client})

        this.getMacy();
        await this.list(client);
    }

    getMacy = () => {
        if (this.state.masonry) {
            this.state.masonry.reInit()
        } else {
            let masonry = new Macy({
                container: '.macy-container', // 图像列表容器
                trueOrder: false,
                waitForImages: false,
                useOwnImageLoader: false,
                debug: true,
                margin: { x: 10, y: 10 },    // 设计列与列的间距
                columns: 2,    // 设置列数
            })
            this.setState({ masonry })
        }
    }

    getURLfromCID = (cid) => {
        return `${gateway}/${cid}`;
    };

    list = async (client) => {
        const d = new Date()
        d.setDate(d.getDate() )
        const before = d.toISOString()
        // limit to ten results
        const maxResults = 10

        const urls  = []

        for await (const upload of client.list({ before, maxResults })) {
            const url = await this.getImageMetadata(upload["cid"])
            urls.push(url)
            console.log(url)
        }
        this.setState({
                dataImages:urls
            }
        )
    }

    jsonFile(filename, obj) {
        return new File([JSON.stringify(obj)], filename)
    }
    showMessage(text) {
        const output = document.getElementById('output')
        if (!output) {
            return
        }
        const node = document.createElement('div')
        node.innerText = text
        output.appendChild(node)
    }

    async getImageMetadata(cid) {
        const url = this.makeGatewayURL(cid, 'metadata.json')
        const res = await fetch(url)
        if (!res.ok) {
            throw new Error(`error fetching image metadata: [${res.status}] ${res.statusText}`)
        }
        const metadata = await res.json()
        const gatewayURL = this.makeGatewayURL(cid, metadata.path)
        return gatewayURL;
    }

    makeGatewayURL(cid, path) {
        return `https://${cid}.ipfs.dweb.link/${encodeURIComponent(path)}`
    }

    onChange = async (e) => {
        var files = e.target.files[0];
        const uploadName = [namePrefix, files.name].join('|')
        const metadataFile = this.jsonFile('metadata.json', {
            path: files.name,
        })

        const cid = await this.state.client.put([files, metadataFile], {
            name: uploadName,

            // onRootCidReady will be called as soon as we've calculated the Content ID locally, before uploading
            onRootCidReady: (localCid) => {
                this.showMessage(`> 🔑 locally calculated Content ID: ${localCid} `)
                this.showMessage('> 📡 sending files to web3.storage ')
            },

            // onStoredChunk is called after each chunk of data is uploaded
            onStoredChunk: (bytes) => this.showMessage(`> 🛰 sent ${bytes.toLocaleString()} bytes to web3.storage`)
        })

        const metadataGatewayURL = this.makeGatewayURL(cid, 'metadata.json')
        const imageGatewayURL = this.makeGatewayURL(cid, files.name)
        const imageURI = `ipfs://${cid}/${files.name}`
        const metadataURI = `ipfs://${cid}/metadata.json`

        console.log(metadataGatewayURL)
        console.log(imageGatewayURL)
        console.log(imageURI)
        console.log(metadataURI)
        await this.list(this.state.client)
    }

    render(){
        return(
            <div className="App">
                <div className="App-header">
                    <div className="app-header-text">
                        <h4
                            className="App-link">
                            Funny Pictures in Every Moment
                        </h4>
                        <span className="App-link-sun">You can also upload funny pictures to get rewards</span>
                        <div>
                            <input type="file" id="file" accept="image/*" style={{display: "none"}} onChange={this.onChange}/>
                            <div style={{marginTop:"24px"}}>
                                <label  htmlFor="file" className="button" >Upload Pic</label>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="macy-container-parent">
                    <div className="macy-container">
                        {
                            this.state.dataImages && this.state.dataImages.map((item,index)=>{
                                // @ts-ignore
                                return (
                                    <img src={item} alt="" className="img_item" key={index}/>
                                )
                            })
                        }
                    </div>
                </div>
            </div>
        )
    } ;
}

