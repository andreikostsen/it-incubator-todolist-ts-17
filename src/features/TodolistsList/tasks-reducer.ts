import {
    TaskPriorities,
    TaskStatuses,
    TaskType,
    todolistsAPI,
    TodolistType,
    UpdateTaskModelType
} from '../../api/todolists-api'
import {Dispatch} from 'redux'
import {AppRootStateType} from '../../app/store'
import {setAppErrorAC, SetAppErrorActionType, setAppStatusAC, SetAppStatusActionType} from '../../app/app-reducer'
import {handleServerAppError, handleServerNetworkError} from '../../utils/error-utils'
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {addTodolistAC, removeTodolistAC, setTodolistsAC} from "./todolists-reducer";

const initialState: TasksStateType = {}

export const fetchTasksTC = createAsyncThunk("tasks/fetchTasks", async (todolistId: string, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}))
    const res = await todolistsAPI.getTasks(todolistId)
    const tasks = res.data.items
    thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}))
    return {tasks, todolistId}
})

export const removeTaskTC = createAsyncThunk("tasks/removeTask", async ( param: {taskId: string, todolistId: string} , thunkAPI)=>{
   await todolistsAPI.deleteTask(param.todolistId, param.taskId)
      return {taskId: param.taskId, todolistId: param.todolistId}            }
)



export const addTaskTC = createAsyncThunk("tasks/addTask", async ( param: {title: string, todolistId: string} , thunkAPI)=>{
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}))
try {
    const res = await todolistsAPI.createTask(param.todolistId, param.title)

    if (res.data.resultCode === 0) {
        const task = res.data.data.item
        thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}))
        return {task}
    } else {
        handleServerAppError(res.data, thunkAPI.dispatch);
    }
}  catch(error) {handleServerNetworkError(error, thunkAPI.dispatch)}
        })


//
// export const addTaskTC_ = (title: string, todolistId: string) => (dispatch: Dispatch<ActionsType | SetAppErrorActionType | SetAppStatusActionType>) => {
//     dispatch(setAppStatusAC({status: 'loading'}))
//     todolistsAPI.createTask(todolistId, title)
//         .then(res => {
//             if (res.data.resultCode === 0) {
//                 const task = res.data.data.item
//                 const action = addTaskAC({task})
//                 dispatch(action)
//                 dispatch(setAppStatusAC({status: 'succeeded'}))
//             } else {
//                 handleServerAppError(res.data, dispatch);
//             }
//         })
//         .catch((error) => {
//             handleServerNetworkError(error, dispatch)
//         })
// }
//
// export const removeTaskTC_ = (taskId: string, todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
//     todolistsAPI.deleteTask(todolistId, taskId)
//         .then(res => {
//             const action = removeTaskAC({taskId, todolistId})
//             dispatch(action)
//         })
// }


export const updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
    (dispatch: ThunkDispatch, getState: () => AppRootStateType) => {
        const state = getState()
        const task = state.tasks[todolistId].find(t => t.id === taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...domainModel
        }

        todolistsAPI.updateTask(todolistId, taskId, apiModel)
            .then(res => {
                if (res.data.resultCode === 0) {
                    const action = updateTaskAC({taskId, model: domainModel, todolistId})
                    dispatch(action)
                } else {
                    handleServerAppError(res.data, dispatch);
                }
            })
            .catch((error) => {
                handleServerNetworkError(error, dispatch);
            })
    }
//
// export const updateTaskTC = createAsyncThunk("tasks/updateTask",(param: {taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string}, thunkAPI) => {
// //
//         const state = thunkAPI.getState()
//         const task = state.tasks[todolistId].find(t => t.id === taskId)
//         if (!task) {
//             //throw new Error("task not found in the state");
//             console.warn('task not found in the state')
//             return
//         }
//
//         const apiModel: UpdateTaskModelType = {
//             deadline: task.deadline,
//             description: task.description,
//             priority: task.priority,
//             startDate: task.startDate,
//             title: task.title,
//             status: task.status,
//             ...domainModel
//         }
//
//         todolistsAPI.updateTask(todolistId, taskId, apiModel)
//             .then(res => {
//                 if (res.data.resultCode === 0) {
//                     const action = updateTaskAC({taskId, model: domainModel, todolistId})
//                     thunkAPI.dispatch(action)
//                 } else {
//                     handleServerAppError(res.data, thunkAPI.dispatch);
//                 }
//             })
//             .catch((error) => {
//                 handleServerNetworkError(error, thunkAPI.dispatch);
//             })
//     }
// })



const slice = createSlice({
    name: "tasks",
    initialState: initialState,
    reducers: {


        // removeTaskAC(state, action: PayloadAction<{ taskId: string, todolistId: string }>) {
        //
        //
        //     const tasks = state[action.payload.todolistId]
        //
        //     const index = tasks.findIndex(t=> t.id === action.payload.taskId)
        //
        //     if(index > -1) {tasks.splice(index, 1)}


        // },

        // addTaskAC(state, action: PayloadAction<{ task: TaskType }>) {
        //      state[action.payload.task.todoListId].unshift(action.payload.task)
        //
        //
        // },
        updateTaskAC(state, action: PayloadAction<{ taskId: string, model: UpdateDomainTaskModelType, todolistId: string }>) {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t=>t.id === action.payload.taskId)
            if(index > -1) {
                tasks[index] = {...tasks[index],...action.payload.model}
            }

        },
        // setTasksAC(state, action: PayloadAction<{ tasks: Array<TaskType>, todolistId: string }>) {
        //     state[action.payload.todolistId] = action.payload.tasks
        // },
    },

    extraReducers: (builder) => {
        builder.addCase(addTodolistAC, (state, action) => {
            state[action.payload.todolist.id] = []
        });
        builder.addCase(removeTodolistAC, (state, action) => {
            delete state[action.payload.id]
        });
        builder.addCase(setTodolistsAC, (state, action) => {
            action.payload.todolists.forEach(tl => state[tl.id] = [])
        });
        builder.addCase(fetchTasksTC.fulfilled, (state, action) => {
            state[action.payload.todolistId] = action.payload.tasks
        });
        builder.addCase(removeTaskTC.fulfilled, (state, action) => {
            const tasks = state[action.payload.todolistId]
            const index = tasks.findIndex(t=> t.id === action.payload.taskId)
            if(index > -1) {tasks.splice(index, 1)}
        });
        builder.addCase(addTaskTC.fulfilled, (state, action) => {
            if (action.payload) {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            }

        });


    }


})

export const tasksReducer = slice.reducer

//export const removeTaskAC = slice.actions.removeTaskAC
//export const addTaskAC = slice.actions.addTaskAC
export const updateTaskAC = slice.actions.updateTaskAC
//export const setTasksAC = slice.actions.setTasksAC


// thunks
//
// export const _removeTaskTC = (taskId: string, todolistId: string) => (dispatch: Dispatch<ActionsType>) => {
//     todolistsAPI.deleteTask(todolistId, taskId)
//         .then(res => {
//             const action = removeTaskAC({taskId, todolistId})
//             dispatch(action)
//         })
// }


// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}

type ActionsType = ReturnType<typeof updateTaskAC>

type ThunkDispatch = Dispatch<ActionsType | SetAppStatusActionType | SetAppErrorActionType>
