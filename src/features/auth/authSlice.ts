import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/app/store'
import { lookupReports, ReportNotFoundError, type PatientSession } from './reportService'
import { FIELD_ORDER, sanitize, validateAll, type FieldName, type FormValues } from './validation'

type Status = 'idle' | 'loading' | 'success' | 'error'

interface AuthState {
  values: FormValues
  touched: Record<FieldName, boolean>
  submitted: boolean
  status: Status
  submitError: string | null
  session: PatientSession | null
}

const emptyValues: FormValues = { patientId: '', firstName: '', lastName: '' }
const untouched: Record<FieldName, boolean> = { patientId: false, firstName: false, lastName: false }

// Patient details live only in memory, never persisted to storage.
const initialState: AuthState = {
  values: emptyValues,
  touched: untouched,
  submitted: false,
  status: 'idle',
  submitError: null,
  session: null,
}

export const findReports = createAsyncThunk<PatientSession, void, { state: RootState; rejectValue: string }>(
  'auth/findReports',
  async (_, { getState, rejectWithValue, signal }) => {
    const { values } = getState().auth
    if (Object.keys(validateAll(values)).length > 0) {
      return rejectWithValue('Please correct the highlighted details.')
    }
    try {
      return await lookupReports(values, signal)
    } catch (err) {
      if (err instanceof ReportNotFoundError) {
        return rejectWithValue(
          'No report found for these details. Please check the Patient ID and name exactly as printed on your report.',
        )
      }
      return rejectWithValue('We could not reach the report server. Check your connection and try again.')
    }
  },
  { condition: (_, { getState }) => getState().auth.status !== 'loading' },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    fieldChanged(state, action: PayloadAction<{ field: FieldName; value: string }>) {
      const { field, value } = action.payload
      state.values[field] = sanitize(field, value)
      if (state.status === 'error') {
        state.status = 'idle'
        state.submitError = null
      }
    },
    fieldBlurred(state, action: PayloadAction<FieldName>) {
      state.touched[action.payload] = true
    },
    submitAttempted(state) {
      state.submitted = true
      for (const f of FIELD_ORDER) state.touched[f] = true
    },
    sessionCleared: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(findReports.pending, (state) => {
        state.status = 'loading'
        state.submitError = null
      })
      .addCase(findReports.fulfilled, (state, action) => {
        state.status = 'success'
        state.session = action.payload
      })
      .addCase(findReports.rejected, (state, action) => {
        state.status = 'error'
        state.submitError = action.payload ?? 'Something went wrong. Please try again.'
      })
  },
})

export const { fieldChanged, fieldBlurred, submitAttempted, sessionCleared } = authSlice.actions

export const selectAuth = (s: RootState) => s.auth
export const selectErrors = createSelector([(s: RootState) => s.auth.values], validateAll)

export default authSlice.reducer
