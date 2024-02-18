import { Identity } from "@semaphore-protocol/identity";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { getMembersGroup } from "@/utils/bandadaApi";
import Stepper from "@/components/stepper";
import { Group } from "@semaphore-protocol/group";
import { generateProof, generateSindriProof } from "@saurabhchalke/proof";
import {
  encodeBytes32String,
  toBigInt,
  decodeBytes32String,
  toBeHex,
} from "ethers";
import Divider from "@/components/divider";
import { sha256 } from "js-sha256";

const ProofsPage = () => {
  const router = useRouter();
  const { fileContent } = router.query;

  const [_identity, setIdentity] = useState<Identity>();
  const [_loading, setLoading] = useState<boolean>(false);
  const [_renderInfoLoading, setRenderInfoLoading] = useState<boolean>(false);
  const [_feedback, setFeedback] = useState<string[]>([]);

  const localStorageTag = process.env.NEXT_PUBLIC_LOCAL_STORAGE_TAG!;
  const groupId = process.env.NEXT_PUBLIC_BANDADA_GROUP_ID!;

  useEffect(() => {
    const identityString = localStorage.getItem(localStorageTag);
    if (!identityString) {
      router.push("/");
      return;
    }
    const identity = new Identity(identityString);
    setIdentity(identity);
  }, [router, localStorageTag]);

  useEffect(() => {
    getFeedback();
  }, []);

  const sendFeedback = async () => {
    if (!_identity || !fileContent) {
      return;
    }

    const users = await getMembersGroup(groupId);

    if (users) {
      setLoading(true);

      let proof, merkleTreeRoot, nullifierHash;

      try {
        const group = new Group(groupId, 16, users);

        // Use the SHA-256 hash of the file content as the signal
        const signal = "0x" + sha256(fileContent.toString());

        let proofResult;

        if (!process.env.NEXT_PUBLIC_SINDRI_API_KEY || process.env.NEXT_PUBLIC_SINDRI_ENABLED == "false") {
          proofResult = await generateProof(_identity, group, groupId, signal, {
            wasmFilePath: "./semaphore.wasm",
            zkeyFilePath: "./semaphore.zkey",
          });
        } else {
          proofResult = await generateSindriProof(
            _identity,
            group,
            groupId,
            signal,
            process.env.NEXT_PUBLIC_SINDRI_SEMAPHORE_CIRCUIT_ID as string,
            {
              wasmFilePath: "./semaphore.wasm",
              zkeyFilePath: "./semaphore.zkey",
            }
          );
        }

        proof = proofResult?.proof;
        merkleTreeRoot = proofResult?.merkleTreeRoot;
        nullifierHash = proofResult?.nullifierHash;

        const response = await fetch("api/send-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feedback: signal,
            merkleTreeRoot,
            nullifierHash,
            proof,
          }),
        });

        if (response.status === 200) {
          const data = await response.json();

          if (data) setFeedback([data[0].signal, ..._feedback]);

          console.log(`Your sensor data was posted 🎉`);
        } else {
          console.log(await response.text());
          alert(await response.text());
        }
      } catch (error) {
        console.error(error);

        alert("Some error occurred, please try again!");
      } finally {
        setLoading(false);
      }
    }
  };

  const getFeedback = async () => {
    setRenderInfoLoading(true);
    try {
      const response = await fetch("api/get-feedback", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const signals = await response.json();

      if (response.status === 200) {
        setFeedback(signals.map((signal: any) => signal.signal));

        console.log("Feedback retrieved from the database");
      } else {
        alert("Some error occurred, please try again!");
      }
    } catch (error) {
      console.error(error);

      alert("Some error occurred, please try again!");
    } finally {
      setRenderInfoLoading(false);
    }
  };

  const renderFeedback = () => {
    return (
      <div className="lg:w-2/5 md:w-2/4 w-full">
        <div className="flex justify-between items-center mb-10">
          <div className="text-2xl font-semibold text-slate-700">
            Sensor data signals ({_feedback?.length})
          </div>
          <div>
            <button
              className="flex justify-center items-center w-auto space-x-1 verify-btn text-lg font-medium rounded-md bg-gradient-to-r text-slate-700"
              onClick={getFeedback}
            >
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex justify-center items-center my-3">
          <button
            className="flex justify-center items-center w-full space-x-3 disabled:cursor-not-allowed disabled:opacity-50 verify-btn text-lg font-medium rounded-md px-5 py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-slate-100"
            onClick={sendFeedback}
            disabled={_loading || _renderInfoLoading}
          >
            {_loading && <div className="loader"></div>}
            <span>Send Sensor Data</span>
          </button>
        </div>

        {_renderInfoLoading && (
          <div className="flex justify-center items-center mt-20 gap-2">
            <div className="loader-app"></div>
            <div>Fetching sensor data</div>
          </div>
        )}

        {_feedback ? (
          <div className="grid-rows-1 place-content-center">
            <div className="space-y-3">
              {_feedback?.map((feedback, i) => (
                <div
                  key={i}
                  className="overflow-auto border-2 p-3 border-slate-300 space-y-3"
                >
                  {sha256(feedback)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center mt-20">
            <div className="loader-app"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div>
        <div className="flex justify-center items-center">
          <h1 className="text-3xl font-semibold text-slate-700">Prove Sensor Data</h1>
        </div>
        <div className="flex justify-center items-center mt-10">
          <span className="lg:w-2/5 md:w-2/4 w-full">
            <span>
              Sensors can anonymously prove that they are part of a sensor network and are not lying about their data.
            </span>
            <Divider />
          </span>
        </div>
        <div className="flex justify-center items-center mt-5">
          {renderFeedback()}
        </div>
        <div className="flex justify-center items-center mt-10">
          <div className="lg:w-2/5 md:w-2/4 w-full">
            <Stepper step={3} onPrevClick={() => router.push("/groups")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofsPage;
