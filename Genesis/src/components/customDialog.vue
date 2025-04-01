<template>
    <div v-if="props.modelValue" class="dialog-container" id="dialog-container">
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>{{ props.dialogTitle }}</h3>
                <div class="negative-button close-dialog-button" @click="triggerCloseDialog">✕</div>
            </div>
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{modelValue: boolean; dialogTitle: string}>();
const emit = defineEmits(['update:modelValue']);

const triggerCloseDialog = () => {
    emit('update:modelValue', false);
};
</script>

<style scoped>
.dialog-container {
    position: fixed;
    z-index: 1000;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
.dialog-content{
    position: relative;
    min-width: 300px;
    min-height: 200px;
    width: fit-content;
    height: fit-content;
    background-color: rgba(255, 255, 255, 0.137);
    border-radius: 10px;
    padding: 10px;
}
.dialog-header{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-top:5px;
    margin-bottom: 10px;
    height: 10px;
    border-radius: 5px 5px 0 0;
}
.close-dialog-button{
    padding: 4px 8px;
}
</style>