<script setup lang="ts">
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const { signIn, signOut, loggedIn } = useAuth()
const router = useRouter()

async function handleLogin() {
  errorMessage.value = ''
  try {
    await signIn(email.value, password.value)
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login failed'
  }
}

async function handleLogout() {
  await signOut()
  await router.push('/')
}
</script>

<template>
  <div>
    <p><NuxtLink to="/">Home</NuxtLink></p>
    <form
      @submit.prevent="handleLogin"
      v-if="!loggedIn"
    >
      <div>
        <label>
          Email
          <input
            v-model="email"
            type="email"
            required
          />
        </label>
      </div>
      <div>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            required
          />
        </label>
      </div>
      <button type="submit">Log in</button>
    </form>
    <button
      type="button"
      @click="handleLogout"
    >
      Log out
    </button>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>
