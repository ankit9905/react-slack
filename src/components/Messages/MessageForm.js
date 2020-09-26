import React from 'react'
import { Segment,Button,Input } from 'semantic-ui-react';
import uuidv4 from 'uuid/v4'
import firebase from '../../firebase';
import FileModal from './FileModal'
import ProgressBar from './ProgressBar';
import {Picker,emojiIndex  } from "emoji-mart";
import 'emoji-mart/css/emoji-mart.css'

class MessageForm extends React.Component{
    
    state={
        storageRef:firebase.storage().ref(),
        typingRef:firebase.database().ref('typing'),
        message:'',
        uploadState:'',
        uploadTask:null,
        percentUploaded:0,
        loading:false,
        channel:this.props.channel,
        user:this.props.user,
        errors:[],
        modal:false,
        emojiPicker:false
    }

    componentWillUnmount(){
        if(this.state.uploadTask !== null){
            this.state.uploadTask.cancel();
            this.setState({uploadTask:null})
        }
    }

    openModal =()=> this.setState({modal:true})

    closeModal =()=> this.setState({modal:false})


    handleChange = (event) =>{
        this.setState({[event.target.name]:event.target.value})
    }

    handleKeyDown = event =>{

      if(event.ctrlKey && event.keyCode === 13){
          this.sendMessage()
      }

        if(this.state.message){
            this.state.typingRef
             .child(this.state.channel.id)
              .child(this.state.user.uid)
              .set(this.state.user.displayName)
        }
        else{
                this.state.typingRef
                .child(this.state.channel.id)
                .child(this.state.user.uid)
                .remove()
        }
    }

    handleTogglePicker = () =>{
        this.setState({emojiPicker: !this.state.emojiPicker})
    }

    handleAddEmoji = emoji =>{
       const oldMessage = this.state.message;
       const newMessage = this.colonToUnicode(`${oldMessage} ${emoji.colons}`)
       this.setState({message:newMessage,emojiPicker:false})
       setTimeout(() => this.messageInputRef.focus(), 0);
    }

    colonToUnicode = message => {
        return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
          x = x.replace(/:/g, "");
          let emoji = emojiIndex.emojis[x];
          if (typeof emoji !== "undefined") {
            let unicode = emoji.native;
            if (typeof unicode !== "undefined") {
              return unicode;
            }
          }
          x = ":" + x + ":";
          return x;
        });
      };

    createMessage = (fileUrl = null) =>{
        const message={
            timestamp:firebase.database.ServerValue.TIMESTAMP,
            user:{
              id:this.state.user.uid, 
              name:this.state.user.displayName,
              avatar:this.state.user.photoURL
            },
        }
        if(fileUrl !== null){
            message['image'] = fileUrl
        }else{
            message['content'] = this.state.message;
        }
        return message;
    }

    sendMessage=() =>{
        const {getMessagesRef}= this.props;
        const {message,channel}=this.state;

        if(message){
            this.setState({loading:true});
            getMessagesRef()
            .child(channel.id)
            .push()
            .set(this.createMessage())
            .then(()=>{
                this.setState({loading:false,message:'',errors:[]})
                this.state.typingRef
                .child(this.state.channel.id)
                .child(this.state.user.uid)
                .remove()
            })
            .catch((err)=>{
                console.error(err);
                this.setState({loading:false,
                errors:this.state.errors.concat(err)})
            })
        }else{
            this.setState({
                errors:this.state.errors.concat({message:'Add a message'})
            })
        }

    }

    getPath = () => {
        if(this.props.isPrivateChannel){
            return `chat/private/${this.state.channel.id}`
        }else{
            return 'chat/public'
        }
    }

    uploadFile = (file,metadata) =>{
        const pathToUpload = this.state.channel.id;
        const  ref = this.props.getMessagesRef()
        const filePath = `${this.getPath()}/${uuidv4()}.jpg`;

        this.setState({
            uploadState:'uploading',
            uploadTask:this.state.storageRef.child(filePath).put(file,metadata)
        }, 
        ()=>{
            this.state.uploadTask.on('state_changed',snap =>{
                const percentUploaded = Math.round((snap.bytesTransferred /snap.totalBytes)*100);
                this.props.isProgressBarVisible(percentUploaded)
                this.setState({percentUploaded});
            },
             err =>{
                console.error(err);
                this.setState({
                    errors:this.state.errors.concat(err),
                    uploadState:'error',
                    uploadTask:null
                });
            },
            ()=>{
                this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadUrl =>{
                    this.sendFileMessage(downloadUrl,ref,pathToUpload);
                })
                .catch(err =>{
                    console.error(err);
                    this.setState({
                    errors:this.state.errors.concat(err),
                    uploadState:'error',
                    uploadTask:null
                });
                });
               }
             )
          }
        )
    };

    sendFileMessage = (fileUrl,ref,pathToUpload)=>{
        ref.child(pathToUpload)
         .push()
         .set(this.createMessage(fileUrl))
         .then(()=>{
             this.setState({uploadState:'done'})
         })
         .catch(err=>{
            console.error(err);
            this.setState({
            errors:this.state.errors.concat(err)
         })
        })
    }

    render(){

        return(
            <Segment className="message__form" >

                {this.state.emojiPicker &&(
                    <Picker 
                     set="apple" className="emojipicker"
                     onSelect={this.handleAddEmoji}
                     title="Pick your emoji" emoji="point_up"
                     />
                )}

                <Input fluid name="message" 
                 style={{marginBottom:'0.7em'}}
                 label={
                    <Button icon={this.state.emojiPicker ? "close" : "add"}  
                    content={this.state.emojiPicker ? "Close" : null}
                    onClick={this.handleTogglePicker} 
                 />}
                 labelPosition="left"
                 placeholder="Write your message"
                 onChange={this.handleChange}
                 ref={node => (this.messageInputRef = node)}
                 onKeyDown={this.handleKeyDown}
                 className={
                     this.state.errors.some(error =>error.message.includes('message')) ? 'error' :''
                 } 
                 value={this.state.message} />

                <Button.Group icon widths="2">
                    <Button color='orange' content="Add Reply" disabled={this.state.loading}
                       labelPosition="left" icon="edit" onClick={this.sendMessage} />

                    <Button color='teal' content="Upload Media" onClick={this.openModal}
                      disabled={this.state.uploadState === "uploading"}  labelPosition="right" icon="cloud upload" />
                </Button.Group> 
                    <FileModal 
                      modal={this.state.modal}
                      closeModal={this.closeModal}
                      uploadFile={this.uploadFile}
                    />
                    <ProgressBar uploadState={this.state.uploadState}
                     percentUploaded={this.state.percentUploaded} />

            </Segment>
        )
    }
}




export default MessageForm;