<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue'

const router = useRouter();
const modeShowPw = ref(false)

defineProps({
  form: Object,
})
const emit = defineEmits(['login'])
const pwView = () => { modeShowPw.value = !modeShowPw.value }
</script>

<template>
  <div class="login-form" @keyup.enter="emit('login')">
      <label class="field">
        <span class="field__label">학번/교번/사번</span>
        <input type="text" placeholder="학번/교번/사번" v-model="form.memberCode" required>
      </label>
      <label class="field">
        <span class="field__label">비밀번호</span>
        <input :type="modeShowPw ? 'text' : 'password'" placeholder="비밀번호" v-model="form.password"  required>
        <span @click="pwView" class="showPw" :class="!modeShowPw || 'show'">
          <font-awesome-icon icon="fa-solid fa-eye" />
        </span>
      </label>  
    <div class="login-form-row">
      <div class="changePw">
        <button @click="router.push('/auth/password')">비밀번호 찾기</button>
      </div>
    </div>    
    <button class="btn btn-submit" @click="emit('login')">로그인</button>   
      <p class="login-form-hint">
          신입생은 최초 비밀번호로 <b>생년월일 6자리</b>를 사용해 주세요.
      </p> 
  </div>  
</template>

<style scoped lang="scss">
.login-form { display: flex; flex-direction: column; gap: 14px;
  &-row {
    display: flex; align-items: center; justify-content: end;  margin-top: 2px;
    .changePw{ 
      button{ font-size: .95em;background: none;border: none;color: #aaa;cursor: pointer;
      &:hover{color: var(--main-color);}
      }
    }
  }
  &-hint { margin: 0; color: $font-color-dark;
    b { color: $main-color;font-weight: bold; }
  }
}

.field { 
  display: flex;flex-direction: column; gap: 6px; position: relative;
  &__label { font-size:.95em; font-weight: 600;}
  input { height: 40px;  padding: 0 12px; border: 1px solid $line-color; border-radius:5px;  background: #fafdfb; color: $ink-900;
    transition: border-color .15s, box-shadow .15s;
    &::placeholder {color: #ddd;}
    &:hover { border-color: $line-color; }
    &:focus {
      outline: none;
      background: $white;
      border-color: $main-color;
      box-shadow: 0 0 0 4px rgba($hover-bg-color, .14);
    }
  }
  .showPw{
  position: absolute;right: 10px;top: 70%;transform: translateY(-50%);color: #ddd;cursor: pointer;
    &.show{color: var(--font-color);}
  }
}

.btn { height: 50px; border: 0;  font-weight: 700;  cursor: pointer; transition: transform .05s ease, box-shadow .2s ease;letter-spacing: 2px;
  }

</style>    