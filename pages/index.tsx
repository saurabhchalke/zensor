import { Identity } from "@semaphore-protocol/identity"
import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { getGroup } from "@/utils/bandadaApi"
import Stepper from "@/components/stepper"
import Divider from "@/components/divider"

export default function Home() {
  const router = useRouter()

  const [_identity, setIdentity] = useState<Identity>()
  const [fullText, setFullText] = useState<string>("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const match = text.match(/D[0-9A-F]{62}/)
        if (match) {
          const identity = new Identity(match[0])
          setIdentity(identity)
          setFullText(text)
          console.log("Your Semaphore identity was just created 🎉")
        }
      }
      reader.readAsText(file)
    }
  }

  const joinGroup = async () => {
    const groupId = process.env.NEXT_PUBLIC_BANDADA_GROUP_ID!
    const group = await getGroup(groupId)

    if (group === null) {
      alert("Some error ocurred! Group not found!")
      return
    }

    const providerName = group.credentials.id.split("_")[0].toLowerCase()

    const identityCommitment = _identity?.getCommitment().toString()

    window.open(
      `${process.env.NEXT_PUBLIC_BANDADA_DASHBOARD_URL}/credentials?group=${groupId}&member=${identityCommitment}&provider=${providerName}&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}`
    )
  }

  const renderIdentity = () => {
    return (
      <div className="lg:w-2/5 md:w-2/4 w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="text-2xl font-semibold text-slate-700">Cryptographic Identity</div>
        </div>

        <div className="flex justify-center items-center">
          <div className="overflow-auto border-2 p-7 border-slate-300 space-y-3">
            <div className="flex space-x-2">
              <div>Trapdoor:</div>
              <div>{_identity?.trapdoor.toString()}</div>
            </div>
            <div className="flex space-x-2">
              <div>Nullifier:</div>
              <div>{_identity?.nullifier.toString()}</div>
            </div>
            <div className="flex space-x-2">
              <div>Commitment:</div>
              <div>{_identity?.commitment.toString()}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div>
        <div className="flex justify-center items-center">
          <h1 className="text-3xl font-semibold text-slate-700">Attested Sensor Device</h1>
        </div>
        <div className="flex justify-center items-center mt-10">
          <span className="lg:w-2/5 md:w-2/4 w-full">
            <span>
              Please upload the sensor data logging file. The PUF and Sensor data will be extracted and used for attestation.
            </span>
            <br />
            <br />
            <span>
              This app will generate 3 values and immediately use it for zk-based device authentication:
            </span>
            <ol className="list-decimal pl-4 mt-5 space-y-3">
              <li>Trapdoor: private, known only by user</li>
              <li>Nullifier: private, known only by user</li>
              <li>Commitment: public</li>
            </ol>
            <Divider />
          </span>
        </div>
        <div className="flex justify-center items-center mt-5">
          <input style={{marginLeft: 120}} type="file" accept=".txt" onChange={handleFileChange} />
        </div>
        <br />
        <div className="flex justify-center items-center mt-5">
          {_identity ? (
            renderIdentity()
          ) : (
            <span className="text-slate-700">Upload a file to create identity</span>
          )}
        </div>
        <div className="flex justify-center items-center mt-10">
          <div className="lg:w-2/5 md:w-2/4 w-full">
            <Stepper
              step={1}
              onNextClick={_identity && (() => router.push({
                pathname: "/groups",
                query: { fileContent: fullText },
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
