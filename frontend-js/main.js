import Search from './modules/search'
import Chat from './modules/chat'
import RegistrationForm from './modules/registrationForm'

if (document.querySelector('#registration-form')) {
    new RegistrationForm()
}
//Chat
if (document.querySelector('#chat-wrapper')) {
    new Chat()
}
//Search 
if (document.querySelector('.header-search-icon')) {
    new Search()
}