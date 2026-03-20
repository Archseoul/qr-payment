<script setup lang="ts">
import SockJS from 'sockjs-client'
import type { IStompSocket } from '@stomp/stompjs'
import { Client } from '@stomp/stompjs'
import { WebSocket } from 'ws'
import { QScrollArea } from 'quasar'
import type { ChatMessage } from '~/types'

const messages = ref<ChatMessage[]>([])
const name = ref('')
const messageText = ref('')
const config = useRuntimeConfig()

const scrollAriaRef = ref<QScrollArea | null>(null)

if (process.client) {
  if (localStorage.getItem('messages') != null) {
    messages.value = JSON.parse(localStorage.getItem('messages')!) as ChatMessage[]
  }
}
const socket = new SockJS(config.public.baseUrl + '/chat')
const client = new Client()

// const stompClient = Stomp.over(socket)
//   stompClient.connect({}, () => {
//     console.log('connected')
//   })
const userAuth = useCookie('token')

client.configure({
  brokerURL: config.public.webSocketUrl,
  connectHeaders: {
    Authorization: userAuth.value ?? ''
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 1000,
  heartbeatOutgoing: 1000,
  onConnect: () => {
    scrollAriaRef.value?.setScrollPercentage('vertical', 100)
    client.subscribe('/topic/public', async (message) => {
      const newChatMessage = JSON.parse(message.body) as ChatMessage
      messages.value.push(newChatMessage)
      await nextTick()
      scrollAriaRef.value?.setScrollPercentage('vertical', 100)
    })
  }
})
if (typeof WebSocket !== 'function') {
  // For SockJS you need to set a factory that creates a new SockJS instance
  // to be used for each (re)connect
  client.webSocketFactory = function () {
    // Note that the URL is different from the WebSocket URL
    return socket as IStompSocket
  }
}

watch(messages, () => {
  localStorage.setItem('messages', JSON.stringify(messages.value))
}, { deep: true })

client.activate()
const sendMessage = () => {
  if (messageText.value === '') {
    return
  }
  if (name.value === '') {
    return
  }
  client.publish({
    destination: '/app/chat',
    body: JSON.stringify({
      from: name.value,
      text: messageText.value
    })
  })
  messageText.value = ''
}

onBeforeUnmount(() => {
  client.deactivate()
})

</script>

<template>
  <client-only>
    <div class="main-content relative-position full-height column">
      <div class="q-pa-md row">
        <q-input v-model="name" label="Name" />
      </div>
      <div class="q-pa-md row justify-center">
        <q-scroll-area ref="scrollAriaRef" class="full-width" style="height: 400px">
          <div style="width: 100%; max-width: 400px">
            <q-chat-message
              v-for="message in messages"
              :key="messages.indexOf(message)"
              :name="message.from"
              :text="[message.text]"
              :sent="message.from == name"
              :stamp="message.time"
            />
          </div>
        </q-scroll-area>
      </div>
      <div class="q-pa-md">
        <q-input
          v-model="messageText"
          label="Message"
          :disable="name === ''"
          :hint="name === '' ? $t('COMPANY.059') : ''"
          @keyup.enter="sendMessage"
        />
      </div>
    </div>
  </client-only>
</template>

<style scoped lang="scss">

</style>
