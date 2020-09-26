import React from 'react';
import { Grid ,Header,Icon,Dropdown,Image,Modal, Input, Button} from 'semantic-ui-react';
import firebase from '../../firebase'
import  AvatarEditor  from 'react-avatar-editor';



class UserPanel extends React.Component {

    state={
        modal:false,
        previewImage:'',
        croppedImage:'',
        uploadCroppedImage:'',
        blob:'',
        storageRef:firebase.storage().ref(),
        userRef:firebase.auth().currentUser,
        usersRef:firebase.database().ref('users'),
        metadata:{
            contentType:'image/jpeg'
        }
    }

    openModal = () => this.setState({modal:true})

    closeModal = () => this.setState({modal:false})
    
    dropdownOptions = () =>[
        {
            key:'user',
            text:<span>Signed in as <strong>{this.props.user.displayName}</strong></span>,
            disabled:true
        },
        {
            key:'avatar',
            text:<span onClick={this.openModal}>Change Avatar</span>
        },
        {
            key:'signout',
            text:<span onClick={this.handleSignout}>Sign Out </span>
        }
    ]

    uploadCroppedImage = () =>{
       const {storageRef,userRef,blob,metadata} = this.state;

       storageRef
       .child(`avatars/users/${userRef.uid}`)
       .put(blob,metadata)
       .then(snap=>{
           snap.ref.getDownloadURL().then(downloadURL =>{
               this.setState({uploadedCroppedImage:downloadURL},()=>
               this.changeAvatar())
           })
       })
    }

    changeAvatar = () =>{
        this.state.userRef
        .updateProfile({
            photoURL:this.state.uploadedCroppedImage
        })
        .then(()=>{
            this.closeModal()
        })
        .catch(err=>{
            console.error(err);
        })

        this.state.usersRef
        .child(this.state.userRef.uid)
        .update({avatar:this.state.uploadedCroppedImage})
        .then(()=>{
            console.log('sb')
        })
        .catch(err=>{
            console.error(err);
        })
    }

    handelChange = event =>{
        const file = event.target.files[0];
        const reader = new FileReader();

        if(file){
            reader.readAsDataURL(file);
            reader.addEventListener("load",()=>{ 
                this.setState({previewImage:reader.result});
            })
        }
    }

    handleCropImage = () =>{
      if(this.avatarEditor){
          this.avatarEditor.getImageScaledToCanvas().toBlob(blob =>{
              let imageUrl = URL.createObjectURL(blob);
              this.setState({
                  croppedImage:imageUrl,
                  blob
              })
          })
      }
    }
    
    handleSignout = () =>{
        firebase
        .auth()
        .signOut()
        .then(()=>console.log("Signed Out!"))
    }
    
    render(){
        return  (
            <Grid style={{background:this.props.primary}}>
                <Grid.Column>
                    <Grid.Row style={{padding:'1.2em',margin:0}}>
                        <Header inverted floated="left" as="h2">
                            <Icon name="code" />
                            <Header.Content>DevChat</Header.Content>
                        </Header>
                   
                         <Header style={{padding:'0.25em'}} as="h4" inverted>
                            <Dropdown trigger={
                                <span>
                                    <Image src={this.props.user.photoURL} spaced="right" avatar />
                                    {this.props.user.displayName}
                                </span>
                            } options={this.dropdownOptions()}></Dropdown>
                         </Header>
                    </Grid.Row>
                 {/* Change user avatar modal */}
                  <Modal basic open={this.state.modal} onClose={this.closeModal}>
                      <Modal.Header>Change Avatar</Modal.Header>
                      <Modal.Content>
                          <Input onChange={this.handelChange}
                            fluid 
                            type="file" 
                            label="New Avatar" 
                            name="previewImage"
                          />
                          <Grid centered stackable columns={2}>
                              <Grid.Row centered>
                                  <Grid.Column className="ui center aligned grid">
                                    {this.state.previewImage && (
                                        <AvatarEditor 
                                         ref={node =>(this.avatarEditor = node)}
                                         image={this.state.previewImage}
                                         width={120}
                                         height={120}
                                         border={50}
                                         scale={1.2}
                                        />
                                    )}
                                  </Grid.Column>
                                  <Grid.Column>
                                      {this.state.croppedImage && (
                                          <Image 
                                            style={{margin:'3.5em auto'}}
                                            width={100}
                                            height={100}
                                            src={this.state.croppedImage}
                                          />
                                      )}
                                  </Grid.Column>
                              </Grid.Row>
                          </Grid>
                      </Modal.Content>
                      <Modal.Actions>
                          {this.state.croppedImage && <Button color="green" inverted onClick={this.uploadCroppedImage}>
                              <Icon name="save" /> Change Avatar 
                          </Button>}
                          <Button color="green" inverted onClick={this.handleCropImage}>
                              <Icon name="image" /> Preview
                          </Button>
                          <Button color="red" inverted onClick={this.closeModal}>
                              <Icon name="remove" /> Cancel 
                          </Button>
                      </Modal.Actions>
                  </Modal>
                </Grid.Column>
            </Grid>
        )
    }
}


export default UserPanel;