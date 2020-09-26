import React from 'react';
import {Segment,Comment} from 'semantic-ui-react'
import MessagesHeader from './MessagesHeader'
import MessageForm from './MessageForm'
import firebase from '../../firebase';
import {connect} from 'react-redux'
import Message from './Message'
import {setUserPosts} from '../../actions'
import Typing from "./Typing";
import Skeleton from "./Skeleton";

class Messages extends React.Component{
    
    state={
        isPrivateChannel:this.props.isPrivateChannel,
        privateMessageRef:firebase.database().ref('privateMessages'),
        messagesRef:firebase.database().ref('messages'),
        channel:this.props.channel,
        messages:[],
        messageLoading:true,
        isChannelStarred:false,
        user:this.props.user,
        usersRef:firebase.database().ref('users'),
        progressBar:false,
        numUniqueUsers:'',
        searchTerm:'',
        searchLoading:false,
        searchResults:[],
        typingRef:firebase.database().ref('typing'),
        typingUsers:[],
        connectedRef:firebase.database().ref('.info/connected'),
        listeners:[]
    }

    componentDidMount(){
        const {channel,user,listeners} =this.state;

        if(channel && user){
            this.removeListeners(listeners);
            this.addListeners(channel.id);
            this.addUserStarsListener(channel.id,user.uid);
        }
    }

    componentWillUnmount(){
        this.removeListeners(this.state.listeners);
        this.state.connectedRef.off()
    }

    removeListeners = listeners =>{
        listeners.forEach(listener =>{
            listener.ref.child(listener.id).off(listener.event)
        })
    }

    addToListeners = (id,ref,event) =>{
        const index = this.state.listeners.findIndex(listener =>{
            return listener.id === id && listener.ref === ref && listener.event === event
        })

        if(index === -1){
            const newListener = {id,ref,event}
            this.setState({listeners:this.state.listeners.concat(newListener)})
        }
    }

    componentDidUpdate(prevProps,prevState){
        if(this.messagesEnd){
            this.scrollToBottom()
        }
    }
    
    scrollToBottom = () =>{
        this.messagesEnd.scrollIntoView({behavior:'smooth'})
    }

    addListeners = channelId =>{
        this.addMessageListener(channelId);
        this.addTypinglisteners(channelId)
    }

    addTypinglisteners = channelId =>{
        let typingUsers=[];
        this.state.typingRef.child(channelId).on('child_added',snap=>{
            if(snap.key !== this.state.user.uid){
                typingUsers = typingUsers.concat({
                    id:snap.key,
                    name:snap.val()
                })
                this.setState({typingUsers})
            }
        })

        this.addToListeners(channelId,this.state.typingRef,"child_added")

        this.state.typingRef.child(channelId).on('child_removed',snap=>{
            const index = typingUsers.findIndex(user => user.id === snap.key);
            if(index !== -1){
                typingUsers = typingUsers.filter(user => user.id !== snap.key);
                this.setState({typingUsers});
            }
        })

        this.addToListeners(channelId,this.state.typingRef,"child_removed")


        this.state.connectedRef.on("value",snap=>{
            if(snap.val() === true){
                this.state.typingRef
                .child(channelId)
                .child(this.state.user.uid)
                .onDisconnect()
                .remove(err=>{
                    if(err!== null){
                        console.error(err)
                    }
                })
            }
        })
    }

    addMessageListener = channelId =>{
        let loadedMessage=[];
        const ref = this.getMessagesRef();
        ref.child(channelId).on('child_added',snap=>{
            loadedMessage.push(snap.val());
            // console.log(loadedMessage)
            this.setState({
                messages:loadedMessage,
                messageLoading:false
            });
            this.countUniqueUsers(loadedMessage);
            this.countUserPosts(loadedMessage)
        })
        this.addToListeners(channelId,ref,"child_added")

    }

    addUserStarsListener =(channelId,userId) =>{
       this.state.usersRef
       .child(userId)
       .child('starred')
       .once('value')
       .then(data =>{
           if(data.val() !== null){
               const channelIds = Object.keys(data.val())
               const prevStarred = channelIds.includes(channelId);
               this.setState({isChannelStarred:prevStarred})
           }
       })
    }

    getMessagesRef = () =>{
        const {messagesRef,privateMessageRef,isPrivateChannel} = this.state;
        return isPrivateChannel ? privateMessageRef : messagesRef
    }

    handleSearchChange = event =>{
        this.setState({
            searchTerm:event.target.value,
            searchLoading:true
        },()=>this.handleSearchMessages());
    }

    handleStar = () =>{
        this.setState(
            prevState =>({
            isChannelStarred:!prevState.isChannelStarred
        }),
        ()=>this.starChannel()
        );
    };

    starChannel = () =>{
        if(this.state.isChannelStarred){
            this.state.usersRef
             .child(`${this.state.user.uid}/starred`)
             .update({
                 [this.state.channel.id]:{
                     name:this.state.channel.name,
                     details:this.state.channel.details,
                     createdBy:{
                         name:this.state.channel.createdBy.name,
                         avatar:this.state.channel.createdBy.avatar
                     }
                 }
             })
        }else {
            this.state.usersRef
            .child(`${this.state.user.uid}/starred`)
            .child(this.state.channel.id)
            .remove(err =>{
                if(err !== null){
                    console.error(err)
                }
            })
        }
    }

    handleSearchMessages = () =>{
        const channelMessage = [...this.state.messages]
        const regex = new RegExp(this.state.searchTerm,'gi');
        const searchResults = channelMessage.reduce((acc,message)=>{
            // eslint-disable-next-line
            if(message.content && message.content.match(regex)||message.user.name.match(regex)){
                acc.push(message);
            }
            return acc;
        },[])
        this.setState({searchResults})
        setTimeout(()=>this.setState({searchLoading:false}),1000); 
    }
    
    countUniqueUsers = messages =>{
        const uniqueUsers = messages.reduce((acc,message)=>{
            if(!acc.includes(message.user.name)){
                acc.push(message.user.name)
            }
            return acc
        },[])
        const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
        const numUniqueUsers = `${uniqueUsers.length} user${plural ?"s":""}`;
        this.setState({numUniqueUsers})
    }

    countUserPosts = messages =>{
        let userPosts = messages.reduce((acc,message)=>{
            if(message.user.name in acc){
                acc[message.user.name].count+=1;
            }else{
                acc[message.user.name] = {
                    avatar:message.user.avatar,
                    count:1
                }
            }
            return acc
        },{});
        this.props.setUserPosts(userPosts)
    }

    displayMessages = messages =>(
        messages.length > 0 && messages.map(message =>(
            <Message key={message.timestamp} 
            message={message} user={this.state.user} />
        ))
    )

    isProgressBarVisible = percent =>{
        if(percent>0){
            this.setState({progressBar:true})
        }
    }

    displayChannelName = channel => {
        return channel ? `${this.state.isPrivateChannel ? '@':'#'}${channel.name}`:'';
    }

    displayTypingUsers = users =>(
       users.length > 0 && users.map(user =>(
        <div style={{display:'flex',alignItems:'center',marginBottom:'0.2em'}} key={user.id}>
            <span className="user__typing">{user.name} is typing</span><Typing />
        </div>
       ))                
    )

    displayMessageSkeleton = loading =>(
        loading ? (
            <React.Fragment>
                {[...Array(10)].map((_,i)=>(
                    <Skeleton key={i} />
                ))}
            </React.Fragment>
        ):null
    )

    render(){
        return(
            <React.Fragment>
                <MessagesHeader 
                 channelName={this.displayChannelName(this.state.channel)} 
                 numUniqueUsers={this.state.numUniqueUsers}
                 handleSearchChange={this.handleSearchChange}
                 searchLoading={this.state.searchLoading}
                 isPrivateChannel={this.state.isPrivateChannel}
                 handleStar={this.handleStar}
                 isChannelStarred={this.state.isChannelStarred}
                />

                <Segment>
                    <Comment.Group className={this.state.progressBar ?"messages__progress":"messages"}>
                        {this.displayMessageSkeleton(this.state.messageLoading)}
                       {this.state.searchTerm ? this.displayMessages(this.state.searchResults):
                       this.displayMessages(this.state.messages)}
                       {this.displayTypingUsers(this.state.typingUsers)}
                       <div ref={node =>(this.messagesEnd = node)}></div>
                    </Comment.Group>
                </Segment>

                <MessageForm 
                    messagesRef={this.state.messagesRef} 
                    channel={this.props.channel}
                    user={this.props.user}
                    isProgressBarVisible={this.isProgressBarVisible}
                    isPrivateChannel = {this.state.isPrivateChannel}
                    getMessagesRef = {this.getMessagesRef}
                />
            </React.Fragment>
        )
    }
}


export default connect(null,{setUserPosts})(Messages);  