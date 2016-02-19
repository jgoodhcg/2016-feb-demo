(ns febdemo.config
  (:require [clojure.tools.logging :as log]))

(def defaults
  {:init
   (fn []
     (log/info "\n-=[febdemo started successfully]=-"))
   :middleware identity})
